import { User } from 'src/auth/entities/t_users.entity';
import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany } from 'typeorm';
import { IdType } from './t_idType.entity';

@Index('iso_code', ['isoCode3'], { unique: true })
@Index('iso_code2', ['isoCode2'], { unique: true })
@Entity('T_COUNTRY')
export class Country {
    @PrimaryGeneratedColumn({ name: 'COU_ID', type: 'int' })
    COU_ID: number;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'iso_code2', type: 'char', length: 2 })
    isoCode2: string;

    @Column({ name: 'iso_code3', type: 'char', length: 3 })
    isoCode3: string;

    @Column({ name: 'phone_code', type: 'varchar', length: 10 })
    phoneCode: string;

    @Column({ name: 'capital', type: 'varchar', length: 255, nullable: true })
    capital?: string;

    @Column({ name: 'continent', type: 'varchar', length: 255, nullable: true })
    continent?: string;

    @Column({ name: 'currency', type: 'varchar', length: 255, nullable: true })
    currency?: string;

    @Column({ name: 'code_currency', type: 'varchar', length: 15, nullable: true })
    codeCurrency?: string;

    @OneToMany(() => User, (user) => user.Tcountry)
    users: User[];

    @OneToMany(() => IdType, (idType) => idType.country)
    idTypes: IdType[];
}
