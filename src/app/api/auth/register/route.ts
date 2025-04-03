// src/app/api/auth/register/route.ts

import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { User } from '@/models';

export async function POST(request: NextRequest) {
  try {
    const { firstName, middleName, lastName, extensionName, username, password, confirmPassword, email } = await request.json();

    // Validate passwords
    if (password !== confirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
    }

    // Check if username or email exists
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }

    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user in the database
    const newUser = await User.create({
      firstName,
      middleName,
      lastName,
      extensionName,
      username,
      password: hashedPassword,
      email,
    });

    return NextResponse.json({ message: 'Registration successful', user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: 'Registration failed' }, { status: 500 });
  }
}
