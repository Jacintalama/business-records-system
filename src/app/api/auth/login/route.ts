// src/app/api/auth/login/route.ts

import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Import User model (adjust the path and code as needed)
import { User } from '@/models';

// Use an environment variable for the JWT secret
const JWT_SECRET = process.env.JWT_SECRET || '0216cd9396619f3abfcec489fe0697d9ce6ec029543998da9b47cb3ebd5e5444bf9d601dea2be92c858c8bc7d21f4fdd82074df0e3a0d81b9bb468286e7dbfe8';

export async function POST(request: NextRequest) {
  // Parse JSON from the request
  const { username, password } = await request.json();

  // Look up the user in database (adjust the query for your ORM)
  const user = await User.findOne({ where: { username } });
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  // Verify the password using bcrypt
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  // Generate a JWT token
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '1h',
  });

  // Create the response and set an HTTP-only cookie with the token
  const response = NextResponse.json({ message: 'Login successful' });
  response.cookies.set('token', token, { httpOnly: true, path: '/' });
  return response;
}
