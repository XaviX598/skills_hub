/**
 * Server Action: Register with email/password and email verification
 */

'use server';

import { getPrisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { generateVerificationCode, getCodeExpiration, sendVerificationEmail } from '@/lib/email';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').refine((email) => email.includes('@'), 'Email must contain @'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .refine((password) => /[A-Z]/.test(password), 'Password must contain at least one uppercase letter')
    .refine((password) => /[a-z]/.test(password), 'Password must contain at least one lowercase letter')
    .refine((password) => /[0-9]/.test(password), 'Password must contain at least one number')
    .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), 'Password must contain at least one special character (!@#$%^&*...)'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export async function registerUser(formData: FormData) {
  const prisma = getPrisma();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const validatedFields = registerSchema.safeParse({ name, email, password, confirmPassword });

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }

  const { name: validatedName, email: validatedEmail, password: validatedPassword } = validatedFields.data;

  const existingUser = await prisma.user.findUnique({ where: { email: validatedEmail } });

  if (existingUser) {
    if (existingUser.isVerified) {
      return { error: 'Email already registered' };
    }

    const verificationCode = generateVerificationCode();
    const codeExpiration = getCodeExpiration();

    await prisma.user.update({
      where: { email: validatedEmail },
      data: {
        name: existingUser.name ?? validatedName,
        password: existingUser.password ?? await hash(validatedPassword, 12),
        verificationCode,
        verificationCodeExpires: codeExpiration,
        verificationCodeSentAt: new Date(),
      },
    });

    await sendVerificationEmail({
      to: validatedEmail,
      name: validatedName,
      code: verificationCode,
    });

    return {
      requiresVerification: true,
      email: validatedEmail,
      message: 'A new verification code has been sent to your email',
    };
  }

  const verificationCode = generateVerificationCode();
  const codeExpiration = getCodeExpiration();
  const hashedPassword = await hash(validatedPassword, 12);

  await prisma.user.create({
    data: {
      name: validatedName,
      email: validatedEmail,
      password: hashedPassword,
      isVerified: false,
      verificationCode,
      verificationCodeExpires: codeExpiration,
      verificationCodeSentAt: new Date(),
    },
  });

  await sendVerificationEmail({
    to: validatedEmail,
    name: validatedName,
    code: verificationCode,
  });

  return {
    success: true,
    requiresVerification: true,
    email: validatedEmail,
    message: 'Account created! Check your email for verification code.',
  };
}
