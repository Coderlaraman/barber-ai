import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de restablecimiento de contraseña',
    example: 'abc123def456ghi789',
    minLength: 32
  })
  @IsString({ message: 'El token debe ser una cadena' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token!: string

  @ApiProperty({
    description: 'Nueva contraseña',
    example: 'NuevaContraseña123!',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'
  })
  @IsString({ message: 'La contraseña debe ser una cadena' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'
    }
  )
  newPassword!: string

  @ApiProperty({
    description: 'Confirmación de la nueva contraseña',
    example: 'NuevaContraseña123!'
  })
  @IsString({ message: 'La confirmación debe ser una cadena' })
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  confirmPassword!: string
}