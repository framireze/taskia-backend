import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, Index, } from 'typeorm';
import { User } from './t_users.entity';

@Entity('T_CREDENTIALS')
export class LRCredential {
    // Se agrega un identificador surrogate para la clave primaria
    @PrimaryGeneratedColumn('uuid')
    credential_id: string;

    @Column({ type: 'char', length: 36, nullable: true })
    @Index({ unique: true })
    user_id?: string;

    @Column({ type: 'char', length: 100 })
    password: string;

    @CreateDateColumn({ type: 'datetime', name: 'date_created' })
    date_created: Date;

    @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
    updated_at: Date;

    // Relación uno a uno con User
    @OneToOne(() => User, (user) => user.credential, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
