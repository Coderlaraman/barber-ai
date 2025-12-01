import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum PreferenceType {
  NOTIFICATION_BOOKING_CONFIRMED = 'notification_booking_confirmed',
  NOTIFICATION_BOOKING_REMINDER = 'notification_booking_reminder',
  NOTIFICATION_PROMOTIONS = 'notification_promotions',
  THEME = 'theme',
  LANGUAGE = 'language',
  CURRENCY = 'currency',
  TIMEZONE = 'timezone'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

export enum Language {
  ES = 'es',
  EN = 'en',
  PT = 'pt'
}

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.preferences, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: PreferenceType })
  preferenceType: PreferenceType;

  @Column('text')
  preferenceValue: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get valueAsBoolean(): boolean | null {
    if (this.preferenceValue === 'true') return true;
    if (this.preferenceValue === 'false') return false;
    return null;
  }

  get valueAsNumber(): number | null {
    const num = Number(this.preferenceValue);
    return isNaN(num) ? null : num;
  }

  get valueAsTheme(): Theme | null {
    return Object.values(Theme).includes(this.preferenceValue as Theme) 
      ? this.preferenceValue as Theme 
      : null;
  }

  get valueAsLanguage(): Language | null {
    return Object.values(Language).includes(this.preferenceValue as Language) 
      ? this.preferenceValue as Language 
      : null;
  }
}