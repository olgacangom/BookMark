import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('donation_points')
export class DonationPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  address: string;

  @Column({ type: 'float' })
  latitude: number;

  @Column({ type: 'float' })
  longitude: number;

  @Column({ type: 'text', nullable: true })
  needs: string;
}
