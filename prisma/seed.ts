import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Memulai Seeding...');
  await prisma.payment.deleteMany({});     
  await prisma.booking.deleteMany({});     
  await prisma.serviceVariant.deleteMany({}); 
  await prisma.services.deleteMany({});  
  await prisma.category.deleteMany({});     

  const admin = await prisma.user.upsert({
    where: { email: 'admin@solvio.io' },
    update: {},
    create: {
      full_name: 'Valentino Admin',
      email: 'admin@solvio.io',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });
  console.log('Admin account created:', admin.email);

  const ac = await prisma.category.upsert({
    where: { category_name: 'AC' },
    update: {},
    create: { category_name: 'AC' },
  });

  const listrik = await prisma.category.upsert({
    where: { category_name: 'Listrik' },
    update: {},
    create: { category_name: 'Listrik' },
  });

  const kebersihan = await prisma.category.upsert({
    where: { category_name: 'Kebersihan' },
    update: {},
    create: { category_name: 'Kebersihan' },
  });

  const pipa = await prisma.category.upsert({
    where: { category_name: 'Pipa' },
    update: {},
    create: { category_name: 'Pipa' },
  });

  const cuciAc = await prisma.services.create({
    data: { services_name: 'Cuci AC', price: 80000, category_id: ac.id },
  });
  await prisma.serviceVariant.createMany({
    data: [
      { variant_name: '0.5 PK - 1 PK', price: 80000, service_id: cuciAc.id },
      { variant_name: '1.5 PK - 2 PK', price: 110000, service_id: cuciAc.id },
    ],
  });

  const freonAc = await prisma.services.create({
    data: { services_name: 'Isi Freon AC', price: 150000, category_id: ac.id },
  });
  await prisma.serviceVariant.createMany({
    data: [
      { variant_name: 'R32/R410 (0.5 - 1 PK)', price: 150000, service_id: freonAc.id },
      { variant_name: 'R32/R410 (1.5 - 2 PK)', price: 250000, service_id: freonAc.id },
      { variant_name: 'R22 (0.5 - 1 PK)', price: 125000, service_id: freonAc.id },
    ],
  });

  const instalAc = await prisma.services.create({
    data: { services_name: 'Instalasi AC', price: 250000, category_id: ac.id },
  });
  await prisma.serviceVariant.createMany({
    data: [
      { variant_name: 'Pasang Baru (0.5 - 1 PK)', price: 250000, service_id: instalAc.id },
      { variant_name: 'Bongkar Pasang (0.5 - 1 PK)', price: 400000, service_id: instalAc.id },
    ],
  });

  const reparasiAc = await prisma.services.create({
    data: { services_name: 'Reparasi AC', price: 50000, category_id: ac.id },
  });
  await prisma.serviceVariant.createMany({
    data: [
      { variant_name: 'Ganti Kapasitor', price: 225000, service_id: reparasiAc.id },
      { variant_name: 'Las Titik Bocor', price: 150000, service_id: reparasiAc.id },
    ],
  });

  await prisma.services.createMany({
    data: [
      { services_name: 'Instalasi Listrik', price: 150000, category_id: listrik.id },
      { services_name: 'Reparasi Listrik', price: 100000, category_id: listrik.id },
      { services_name: 'Cleaning Service', price: 200000, category_id: kebersihan.id },
      { services_name: 'Instalasi Pipa', price: 175000, category_id: pipa.id },
    ],
  });

  console.log('✅ Seed berhasil!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });