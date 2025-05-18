import { Entity, PrimaryColumn, Column, OneToOne, ManyToOne, JoinColumn, } from 'typeorm';
import { StaffStatus } from '../enum/status-staff.enum';
import { LRCredential } from './t_credentials.entity';
import { Country } from 'src/common/entities/t_country.entity';


@Entity('T_USERS')
export class User {
    @PrimaryColumn({ type: 'char', length: 36 })
    user_id: string;

    @Column({ type: 'char', length: 150 })
    firstName: string;

    @Column({ type: 'char', length: 150, nullable: true })
    lastName?: string;

    @Column({ type: 'char', length: 50, unique: true })
    email: string;

    @Column({ type: 'char', length: 50, nullable: true })
    email_b?: string;

    @Column({ type: 'int', nullable: true })
    country_id?: number;

    @Column({ type: 'char', length: 100, nullable: true })
    country?: string;

    @Column({ type: 'char', length: 15, nullable: true })
    phone?: string;

    @Column({ type: 'int', nullable: true })
    document_type?: number;

    @Column({ type: 'char', length: 30, nullable: true })
    documentID?: string;

    @Column({ type: 'enum', enum: StaffStatus, default: StaffStatus.ACTIVE, comment: 'A: Active, D: Deleted, P: Pending when notified, B: Blocked for any reason', })
    status: StaffStatus;

    @Column({ type: 'char', length: 255, nullable: true })
    iconImage?: string;

    @Column({ type: 'text', nullable: true })
    metadata?: string;

    // Relación uno a uno con las credenciales
    @OneToOne(() => LRCredential, (credential) => credential.user)
    credential: LRCredential;

    @ManyToOne(() => Country, (country) => country.users)
    @JoinColumn({ name: 'country_id' })
    Tcountry: Country;
}
