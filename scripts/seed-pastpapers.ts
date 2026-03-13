import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding past papers...');

  const pastPapers = [
    {
      title: 'Midterm Spring 2023 - CCN',
      subject: 'CCN',
      fileUrl: 'https://example.com/ccn-spring2023.pdf',
      isPlaceholder: false,
    },
    {
      title: 'Final Fall 2022 - Database',
      subject: 'Database',
      fileUrl: 'https://example.com/db-fall2022.pdf',
      isPlaceholder: false,
    },
    {
      title: 'Midterm Fall 2023 - DSA',
      subject: 'DSA',
      fileUrl: 'https://example.com/dsa-fall2023.pdf',
      isPlaceholder: false,
    },
    {
      title: 'Final Spring 2024 - CCN',
      subject: 'CCN',
      fileUrl: '',
      isPlaceholder: true,
    },
    {
      title: 'Midterm Spring 2024 - Database',
      subject: 'Database',
      fileUrl: '',
      isPlaceholder: true,
    },
  ];

  for (const paper of pastPapers) {
    await prisma.pastPaper.create({
      data: paper,
    });
  }

  console.log('Seeded past papers successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
