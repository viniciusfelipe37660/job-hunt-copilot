import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { ApplicationsService } from '../applications/applications.service.js';

describe('AiService', () => {
  let service: AiService;
  let prisma: {
    client: {
      aiSuggestion: Record<string, ReturnType<typeof vi.fn>>;
      skillTag: Record<string, ReturnType<typeof vi.fn>>;
      skillTagOnApplication: Record<string, ReturnType<typeof vi.fn>>;
    };
  };

  beforeEach(async () => {
    prisma = {
      client: {
        aiSuggestion: { upsert: vi.fn().mockResolvedValue({}) },
        skillTag: { upsert: vi.fn().mockImplementation(({ where }) => Promise.resolve({ id: where.name, name: where.name })) },
        skillTagOnApplication: { upsert: vi.fn().mockResolvedValue({}) },
      },
    };

    const config = {
      // No ANTHROPIC_API_KEY configured: AiService must fall back to the mock extraction.
      get: vi.fn().mockReturnValue(undefined),
    };

    const usersService = {
      findOrCreateByClerkId: vi.fn().mockResolvedValue({ id: 'user-1', baseResumeText: 'Minha experiência...' }),
    };

    const applicationsService = {
      findOne: vi.fn().mockResolvedValue({ id: 'app-1' }),
    };

    const module = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
        { provide: ApplicationsService, useValue: applicationsService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(AiService);
  });

  it('falls back to a deterministic mock extraction when ANTHROPIC_API_KEY is unset', async () => {
    const result = await service.extractAndSuggest(
      'clerk-1',
      'app-1',
      'Procuramos dev com experiência em Docker e React para vaga híbrida.',
    );

    expect(result.modelUsed).toBe('mock');
    expect(result.extractedSkills).toEqual(expect.arrayContaining(['Docker', 'React']));
    expect(result.coverLetterSnippet).toContain('MOCK');
  });

  it('falls back to a generic skill list when no known keyword matches the job description', async () => {
    const result = await service.extractAndSuggest('clerk-1', 'app-1', 'Vaga para atendente de loja, sem TI.');

    expect(result.extractedSkills).toEqual(['Comunicação', 'Resolução de problemas', 'Trabalho em equipe']);
  });

  it('persists the suggestion and upserts one skill tag per extracted skill', async () => {
    await service.extractAndSuggest('clerk-1', 'app-1', 'Vaga pede PostgreSQL e Docker.');

    expect(prisma.client.aiSuggestion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { applicationId: 'app-1' } }),
    );
    expect(prisma.client.skillTag.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: 'postgresql' } }),
    );
    expect(prisma.client.skillTag.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: 'docker' } }),
    );
  });
});
