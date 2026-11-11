import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { ApplicationsService } from '../applications/applications.service.js';

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    extracted_skills: { type: 'array', items: { type: 'string' } },
    key_requirements: { type: 'array', items: { type: 'string' } },
    resume_bullets: {
      type: 'array',
      items: { type: 'string' },
      description: 'Tailored resume bullet points, each starting with a strong action verb',
    },
    cover_letter_snippet: { type: 'string' },
  },
  required: ['extracted_skills', 'key_requirements', 'resume_bullets', 'cover_letter_snippet'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a career coach helping a job seeker tailor their application. Given their base resume and a job description, extract the key skills and requirements from the job description, then write 3-5 tailored resume bullet points (each starting with a strong action verb, grounded in the candidate's actual resume content) and a short cover letter opening paragraph. Respond in the same language as the job description.`;

const MOCK_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'NestJS',
  'PostgreSQL', 'Prisma', 'Docker', 'AWS', 'Python', 'SQL', 'REST',
  'GraphQL', 'Git', 'CI/CD', 'Kubernetes', 'Tailwind',
];

interface ExtractionResult {
  extractedSkills: string[];
  keyRequirements: string[];
  resumeBullets: string[];
  coverLetterSnippet: string;
}

@Injectable()
export class AiService {
  private readonly anthropic: Anthropic | null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly applicationsService: ApplicationsService,
  ) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = apiKey ? new Anthropic({ apiKey }) : null;
  }

  async extractAndSuggest(clerkUserId: string, applicationId: string, jobDescriptionText: string) {
    const user = await this.usersService.findOrCreateByClerkId(clerkUserId);
    await this.applicationsService.findOne(clerkUserId, applicationId);

    const modelUsed = this.anthropic
      ? (this.config.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-5')
      : 'mock';

    const result = this.anthropic
      ? await this.callAnthropic(jobDescriptionText, user.baseResumeText ?? '', modelUsed)
      : this.mockExtraction(jobDescriptionText);

    await this.persist(applicationId, result, modelUsed);

    return { ...result, modelUsed, createdAt: new Date().toISOString() };
  }

  private async callAnthropic(jobDescriptionText: string, baseResumeText: string, model: string): Promise<ExtractionResult> {
    const response = await this.anthropic!.messages.create({
      model,
      max_tokens: 4096,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      output_config: { format: { type: 'json_schema', schema: EXTRACTION_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            '<base_resume>', baseResumeText || '(no base resume provided)', '</base_resume>',
            '<job_description>', jobDescriptionText, '</job_description>',
          ].join('\n'),
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const parsed = JSON.parse((textBlock as { text: string }).text);
    return {
      extractedSkills: parsed.extracted_skills,
      keyRequirements: parsed.key_requirements,
      resumeBullets: parsed.resume_bullets,
      coverLetterSnippet: parsed.cover_letter_snippet,
    };
  }

  private mockExtraction(jobDescriptionText: string): ExtractionResult {
    const lower = jobDescriptionText.toLowerCase();
    const matched = MOCK_SKILLS.filter((skill) => lower.includes(skill.toLowerCase()));
    const skills = matched.length > 0 ? matched.slice(0, 6) : ['Comunicação', 'Resolução de problemas', 'Trabalho em equipe'];

    return {
      extractedSkills: skills,
      keyRequirements: [
        'Experiência relevante com as tecnologias e responsabilidades descritas na vaga',
        'Boa comunicação escrita e verbal',
        'Disponibilidade conforme o modelo de trabalho da vaga',
      ],
      resumeBullets: skills
        .slice(0, 3)
        .map((skill) => `Utilizei ${skill} para entregar soluções com impacto mensurável em projetos anteriores`),
      coverLetterSnippet:
        `Tenho grande interesse nesta posição e acredito que minha experiência com ${skills[0] ?? 'tecnologia'} ` +
        'seja um diferencial para contribuir com o time. ' +
        '[MOCK — gerado sem chamar a API da Anthropic porque ANTHROPIC_API_KEY não está configurada]',
    };
  }

  private async persist(applicationId: string, result: ExtractionResult, modelUsed: string) {
    await this.prisma.client.aiSuggestion.upsert({
      where: { applicationId },
      create: {
        applicationId,
        extractedSkills: result.extractedSkills,
        requirements: result.keyRequirements,
        resumeBullets: result.resumeBullets,
        coverLetterSnippet: result.coverLetterSnippet,
        modelUsed,
      },
      update: {
        extractedSkills: result.extractedSkills,
        requirements: result.keyRequirements,
        resumeBullets: result.resumeBullets,
        coverLetterSnippet: result.coverLetterSnippet,
        modelUsed,
      },
    });

    for (const rawName of result.extractedSkills) {
      const name = rawName.trim().toLowerCase();
      if (!name) continue;
      const skillTag = await this.prisma.client.skillTag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      await this.prisma.client.skillTagOnApplication.upsert({
        where: { applicationId_skillTagId: { applicationId, skillTagId: skillTag.id } },
        create: { applicationId, skillTagId: skillTag.id },
        update: {},
      });
    }
  }
}
