import 'dotenv/config';
import { PrismaClient, PublishStatus, SectionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const now = new Date();

  const settings = [
    {
      key: 'general',
      value: {
        companyName: 'Northline Build',
        tagline: 'Construction, Engineering & Project Delivery',
        footerStatement: 'Building with purpose. Delivering with care.',
      },
      overwrite: true,
    },
    {
      key: 'contact',
      value: {
        email: '',
        phone: '',
        address: '',
        businessHours: '',
      },
      overwrite: false,
    },
    {
      key: 'social',
      value: {
        linkedinUrl: '',
        instagramUrl: '',
      },
      overwrite: false,
    },
    {
      key: 'seo',
      value: {
        defaultTitle: 'Northline Build — Construction & Engineering',
        defaultDescription:
          'We bring planning, engineering and on-site execution together to create spaces that work harder, last longer and move businesses forward.',
      },
      overwrite: true,
    },
  ];

  for (const item of settings) {
    await prisma.siteSetting.upsert({
      where: { key: item.key },
      create: { key: item.key, value: item.value },
      update: item.overwrite ? { value: item.value } : {},
    });
  }

  const pages = [
    {
      slug: 'home',
      title: 'Home',
      seoTitle: 'Northline Build — Construction, Engineering & Project Delivery',
      seoDescription:
        'We bring planning, engineering and on-site execution together to create spaces that work harder, last longer and move businesses forward.',
      sections: [
        {
          sectionKey: 'hero',
          type: SectionType.HERO,
          sortOrder: 0,
          isVisible: true,
          content: {
            eyebrow: 'CONSTRUCTION / ENGINEERING / PROJECT DELIVERY',
            headline: 'Built around what comes next.',
            supportingText:
              'We bring planning, engineering and on-site execution together to create spaces that work harder, last longer and move businesses forward.',
            primaryCtaLabel: 'EXPLORE OUR WORK',
            primaryCtaHref: '/projects',
            secondaryCtaLabel: 'START A PROJECT',
            secondaryCtaHref: '/contact',
            videoUrl: null,
            posterUrl: '/images/hero-dark-bw.jpg',
          },
        },
        {
          sectionKey: 'approach',
          type: SectionType.IMAGE_TEXT,
          sortOrder: 1,
          isVisible: true,
          content: {
            eyebrow: 'OUR APPROACH',
            heading: 'A better build starts long before the first pour.',
            body: 'Every project carries a purpose, a deadline and a set of demands. The challenge is bringing them together without losing sight of the details. We turn requirements into a clear plan—aligning people, materials and processes so every stage has direction.',
          },
        },
        {
          sectionKey: 'capabilities',
          type: SectionType.SERVICES_GRID,
          sortOrder: 2,
          isVisible: true,
          content: {
            eyebrow: 'WHAT WE DO',
            heading: 'From the first line to the final handover.',
            intro:
              'A successful project is a sequence of connected decisions. We keep the process moving by bringing each essential stage into focus.',
          },
        },
        {
          sectionKey: 'sectors',
          type: SectionType.IMAGE_TEXT,
          sortOrder: 3,
          isVisible: true,
          content: {
            eyebrow: 'WHERE WE WORK',
            heading: 'Different spaces. Different demands. One considered approach.',
            body: 'From workplaces to large-scale facilities, every environment asks something different of the build. We shape the process around the purpose, people and practical requirements of each space.',
            items: [
              {
                label: 'Industrial & Manufacturing',
                detail:
                  'Facilities designed around operations, movement, production and the demands of daily work.',
              },
              {
                label: 'Commercial',
                detail:
                  'Workplaces and business environments where function, experience and efficiency need to work together.',
              },
              {
                label: 'Institutional',
                detail:
                  'Spaces created to support learning, public use and the needs of the communities they serve.',
              },
              {
                label: 'Healthcare',
                detail:
                  'Purpose-led environments where planning, coordination and attention to detail are essential.',
              },
              {
                label: 'Hospitality',
                detail:
                  'Places shaped around comfort, experience and the many details that make a space welcoming.',
              },
              {
                label: 'Residential',
                detail:
                  'Thoughtfully planned spaces designed around everyday life, comfort and lasting use.',
              },
            ],
          },
        },
        {
          sectionKey: 'featured-projects',
          type: SectionType.PROJECT_GRID,
          sortOrder: 4,
          isVisible: true,
          content: {
            eyebrow: 'SELECTED WORK',
            heading: 'The work speaks in structures.',
            intro:
              'Every project begins with a different brief. Explore a selection of sample projects that demonstrate how the right planning and execution bring an idea into the built environment. (Fictional demonstration content.)',
            maxItems: 3,
            featuredOnly: true,
          },
        },
        {
          sectionKey: 'northline-difference',
          type: SectionType.IMAGE_TEXT,
          sortOrder: 5,
          isVisible: true,
          content: {
            eyebrow: 'THE NORTHLINE DIFFERENCE',
            heading: 'Good construction is measured in more than concrete and steel.',
            body: 'Every decision from initial brief to final handover is structured around clarity, coordination, and accountable delivery.',
            items: [
              {
                label: 'Clarity before construction',
                detail:
                  'A well-defined brief, scope and programme give every team a shared understanding of what needs to happen next.',
              },
              {
                label: 'Coordination at every stage',
                detail:
                  'Construction depends on people, materials and specialist workstreams moving together. We make coordination part of the process.',
              },
              {
                label: 'Details are part of the design',
                detail:
                  'Buildability, interfaces, materials and finishing all influence how a space performs. The details deserve attention from the start.',
              },
              {
                label: 'Progress you can follow',
                detail:
                  'Clear communication and structured reviews help clients understand progress, decisions and upcoming milestones.',
              },
            ],
          },
        },
        {
          sectionKey: 'closing-cta',
          type: SectionType.CTA,
          sortOrder: 6,
          isVisible: true,
          content: {
            eyebrow: 'Start a conversation',
            heading: 'Have a project taking shape?',
            body: 'Tell us what you need to build, where you plan to build it and what success looks like. We’ll start with the right questions.',
            ctaLabel: 'DISCUSS YOUR PROJECT',
            ctaHref: '/contact',
          },
        },
      ],
    },
    {
      slug: 'about',
      title: 'About Us',
      seoTitle: 'About Northline Build',
      seoDescription:
        'We believe good construction is a team effort. Learn about our story, approach, values, and process.',
      sections: [
        {
          sectionKey: 'about-hero',
          type: SectionType.HERO,
          sortOrder: 0,
          isVisible: true,
          content: {
            eyebrow: 'ABOUT NORTHLINE',
            headline: 'We believe good construction is a team effort.',
            supportingText:
              'A successful build is never the work of one moment or one team. It takes considered planning, technical understanding and people working toward the same outcome. Our approach brings the moving parts of a project into one clear direction.',
          },
        },
        {
          sectionKey: 'story',
          type: SectionType.RICH_TEXT,
          sortOrder: 1,
          isVisible: true,
          content: {
            eyebrow: 'Our Story',
            heading: 'Built on a better way of working.',
            body: 'Construction is complex by nature. Requirements evolve, disciplines overlap and decisions made at one stage can shape everything that follows. Northline Build is founded on a simple idea: the process should be as considered as the finished structure. We focus on connecting the brief, the plan and the work on site—so clients have a clearer path from the first conversation to final handover.',
          },
        },
        {
          sectionKey: 'approach',
          type: SectionType.RICH_TEXT,
          sortOrder: 2,
          isVisible: true,
          content: {
            eyebrow: 'Our Approach',
            heading: 'Think it through. Build it right.',
            body: 'We see construction as a connected process, not a sequence of isolated tasks. We begin by understanding the brief and the people who will use the space. From there, planning and technical coordination establish a practical route forward. During execution, communication and review keep the work aligned with the project requirements. The aim is simple: make informed decisions, resolve issues early and keep the purpose of the project in view.',
          },
        },
        {
          sectionKey: 'values',
          type: SectionType.IMAGE_TEXT,
          sortOrder: 3,
          isVisible: true,
          content: {
            eyebrow: 'What Guides Our Work',
            heading: 'Principles that shape every decision.',
            body: 'Four commitments that keep clients, consultants, suppliers and site teams aligned.',
            items: [
              {
                label: 'PURPOSE',
                detail:
                  'Every decision should serve the function and future use of the space. We begin with what the project needs to achieve.',
              },
              {
                label: 'PRECISION',
                detail:
                  'Good outcomes come from considered planning, coordinated details and attention to the work at every stage.',
              },
              {
                label: 'COLLABORATION',
                detail:
                  'The best work happens when clients, consultants, suppliers and site teams understand the same goal.',
              },
              {
                label: 'RESPONSIBILITY',
                detail:
                  'We value clear communication, realistic commitments and ownership of the work entrusted to us.',
              },
            ],
          },
        },
        {
          sectionKey: 'process',
          type: SectionType.IMAGE_TEXT,
          sortOrder: 4,
          isVisible: true,
          content: {
            eyebrow: 'Our Process',
            heading: 'A clear route from brief to built.',
            body: 'Four structured stages taking your project from initial conversation to handover.',
            items: [
              {
                label: '01 / UNDERSTAND',
                detail:
                  'We listen to the brief, review the site context and define the project’s needs, constraints and priorities.',
              },
              {
                label: '02 / PLAN',
                detail:
                  'We develop the scope, sequence, coordination points and resources required to move the project forward.',
              },
              {
                label: '03 / EXECUTE',
                detail:
                  'We coordinate construction activities and specialist teams, keeping progress, communication and quality reviews connected.',
              },
              {
                label: '04 / COMPLETE',
                detail:
                  'We work through final details, completion requirements and handover so the space can move into its next chapter.',
              },
            ],
          },
        },
        {
          sectionKey: 'about-cta',
          type: SectionType.CTA,
          sortOrder: 5,
          isVisible: true,
          content: {
            heading: 'Let’s make the next build a considered one.',
            body: 'Have a brief, a site or an idea you’re ready to move forward? We’d like to hear about it.',
            ctaLabel: 'START A CONVERSATION',
            ctaHref: '/contact',
          },
        },
      ],
    },
    {
      slug: 'contact',
      title: 'Contact',
      seoTitle: 'Contact — Northline Build',
      seoDescription:
        'Whether you are planning a new facility, developing a commercial space or exploring a construction partnership, tell us about your project.',
      sections: [
        {
          sectionKey: 'contact-hero',
          type: SectionType.HERO,
          sortOrder: 0,
          isVisible: true,
          content: {
            eyebrow: 'Contact',
            headline: 'Let’s give your next project a strong start.',
            supportingText:
              'Whether you’re planning a new facility, developing a commercial space or exploring a construction partnership, tell us a little about the project. Share the details you have today. We’ll take it from there.',
          },
        },
      ],
    },
  ];

  for (const page of pages) {
    const existing = await prisma.page.findUnique({
      where: { slug: page.slug },
      include: { sections: true },
    });
    if (!existing) {
      await prisma.page.create({
        data: {
          slug: page.slug,
          title: page.title,
          status: PublishStatus.PUBLISHED,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          publishedAt: now,
          sections: {
            create: page.sections,
          },
        },
      });
    } else {
      await prisma.page.update({
        where: { id: existing.id },
        data: {
          title: page.title,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
        },
      });
      await prisma.pageSection.deleteMany({ where: { pageId: existing.id } });
      await prisma.pageSection.createMany({
        data: page.sections.map((section) => ({
          ...section,
          pageId: existing.id,
        })),
      });
    }
  }

  await prisma.service.deleteMany({});
  await prisma.service.createMany({
    data: [
      {
        title: '01 / PLAN',
        slug: 'plan',
        summary: 'Brief, site conditions, intended use, and delivery priorities.',
        description:
          'We begin by understanding the brief, site conditions, intended use and delivery priorities. The result is a project plan with a clear scope, sequence and direction.',
        status: PublishStatus.PUBLISHED,
        sortOrder: 0,
      },
      {
        title: '02 / ENGINEER',
        slug: 'engineer',
        summary: 'Practical technical solutions for structure, buildability, and coordination.',
        description:
          'We translate requirements into practical technical solutions, considering structure, buildability, coordination and the details that influence long-term performance.',
        status: PublishStatus.PUBLISHED,
        sortOrder: 1,
      },
      {
        title: '03 / BUILD',
        slug: 'build',
        summary: 'Coordinated site activities, specialist teams, and construction workstreams.',
        description:
          'We coordinate site activities, specialist teams, materials and construction workstreams around the agreed programme, keeping communication and progress in view.',
        status: PublishStatus.PUBLISHED,
        sortOrder: 2,
      },
      {
        title: '04 / DELIVER',
        slug: 'deliver',
        summary: 'Reviews, completion checks, and a structured handover.',
        description:
          'We bring the final details together through reviews, completion checks and a structured handover—so the finished space is ready for its intended purpose.',
        status: PublishStatus.PUBLISHED,
        sortOrder: 3,
      },
    ],
  });

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (adminUser) {
    await prisma.projectMedia.deleteMany({});
    await prisma.project.deleteMany({});

    const sampleProjects = [
      {
        title: 'THE FOUNDRY CAMPUS',
        slug: 'the-foundry-campus',
        excerpt:
          'A production-focused campus planned to bring operational areas, movement routes and support spaces into one connected environment.',
        description:
          'A production-focused campus planned to bring operational areas, movement routes and support spaces into one connected environment.\n\nNote: Fictional demonstration content.',
        category: 'Industrial Facility',
        location: 'Pune, India',
        area: '180,000 sq. ft.',
        completionDate: new Date('2025-11-15T00:00:00Z'),
        sortOrder: 0,
        image: {
          key: 'seed/project-structural.jpg',
          url: '/images/project-structural.jpg',
          alt: 'The Foundry Campus industrial facility architecture',
          name: 'project-structural.jpg',
          sizeBytes: 889750,
        },
      },
      {
        title: 'CIVIC HEALTH CENTRE',
        slug: 'civic-health-centre',
        excerpt:
          'A healthcare facility concept shaped around patient flow, clinical functions and the practical needs of staff and visitors.',
        description:
          'A healthcare facility concept shaped around patient flow, clinical functions and the practical needs of staff and visitors.\n\nNote: Fictional demonstration content.',
        category: 'Healthcare',
        location: 'Jaipur, India',
        area: '95,000 sq. ft.',
        completionDate: new Date('2025-08-20T00:00:00Z'),
        sortOrder: 1,
        image: {
          key: 'seed/project-civic.jpg',
          url: '/images/project-civic.jpg',
          alt: 'Civic Health Centre architectural exterior',
          name: 'project-civic.jpg',
          sizeBytes: 888337,
        },
      },
      {
        title: 'MERIDIAN BUSINESS HOUSE',
        slug: 'meridian-business-house',
        excerpt:
          'A contemporary workplace development designed to balance collaborative spaces, focused work areas and everyday building operations.',
        description:
          'A contemporary workplace development designed to balance collaborative spaces, focused work areas and everyday building operations.\n\nNote: Fictional demonstration content.',
        category: 'Commercial',
        location: 'Bengaluru, India',
        area: '72,000 sq. ft.',
        completionDate: new Date('2025-05-10T00:00:00Z'),
        sortOrder: 2,
        image: {
          key: 'seed/project-timber.jpg',
          url: '/images/project-timber.jpg',
          alt: 'Meridian Business House commercial workplace atrium',
          name: 'project-timber.jpg',
          sizeBytes: 813498,
        },
      },
    ];

    for (const item of sampleProjects) {
      const media = await prisma.media.upsert({
        where: { storageKey: item.image.key },
        update: { publicUrl: item.image.url, altText: item.image.alt },
        create: {
          originalName: item.image.name,
          mimeType: 'image/jpeg',
          sizeBytes: item.image.sizeBytes,
          width: 1200,
          height: 900,
          altText: item.image.alt,
          storageProvider: 'public-static',
          storageKey: item.image.key,
          publicUrl: item.image.url,
          uploadedById: adminUser.id,
        },
      });

      await prisma.project.create({
        data: {
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt,
          description: item.description,
          category: item.category,
          location: item.location,
          area: item.area,
          completionDate: item.completionDate,
          status: PublishStatus.PUBLISHED,
          isFeatured: true,
          sortOrder: item.sortOrder,
          publishedAt: now,
          createdById: adminUser.id,
          updatedById: adminUser.id,
          media: {
            create: {
              mediaId: media.id,
              role: 'COVER',
              sortOrder: 0,
            },
          },
        },
      });
    }
  }

  console.log('Seed completed cleanly.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
