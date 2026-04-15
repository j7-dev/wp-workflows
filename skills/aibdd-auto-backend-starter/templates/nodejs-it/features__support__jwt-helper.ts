import jwt from 'jsonwebtoken';

export class JwtHelper {
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  generateToken(userId: string, expiresIn: string = '1h'): string {
    return jwt.sign({ sub: userId }, this.secret, { expiresIn } as jwt.SignOptions);
  }

  verifyToken(token: string): { sub: string } {
    return jwt.verify(token, this.secret) as { sub: string };
  }
}
