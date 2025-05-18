import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Country } from './t_country.entity';

@Index('FK_T_ID_TYPE_COUNTRY', ['countryId'])
@Entity('T_ID_TYPE')
export class IdType {
    @PrimaryGeneratedColumn({ name: 'ID_TYPE_ID', type: 'int' })
    id: number;

    @Column({ name: 'TYPE', type: 'varchar', length: 10 })
    type: string;

    @Column({ name: 'NAME', type: 'varchar', length: 100 })
    name: string;

    @Column({ name: 'COU_ISO', type: 'char', length: 3 })
    couIso: string;

    @Column({ name: 'COU_ID', type: 'int' })
    countryId: number;

    @ManyToOne(() => Country, (country) => country.idTypes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'COU_ID' })
    country: Country;
}
