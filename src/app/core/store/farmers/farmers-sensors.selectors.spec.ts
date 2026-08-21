import { Project, ProjectStatus } from '../../models/project.model';
import { SensorDevice, SensorReading } from '../../models/sensor-reading.model';
import { selectParcelsWithSensors, selectParcelSensorView } from './farmers-sensors.selectors';

const parcelA: Project = {
  id: 'parcel-a',
  ownerId: 'u1',
  name: 'North Field',
  description: 'A',
  latitude: 1,
  longitude: 2,
  methodology: 'water-quality-credits-v1',
  status: ProjectStatus.ACTIVE,
  areaHectares: 10,
  baselineStart: '2024-01-01',
  baselineEnd: '2024-06-01',
  createdAt: '',
  updatedAt: '',
};

const parcelB: Project = { ...parcelA, id: 'parcel-b', name: 'South Field' };

const deviceA: SensorDevice = {
  id: 'dev-a',
  projectId: 'parcel-a',
  deviceId: 'hw-1',
  manufacturer: 'X',
  model: 'Y',
  parameters: ['ph'],
  publicKey: 'pk',
  isActive: true,
  createdAt: '',
};

const deviceB: SensorDevice = {
  ...deviceA,
  id: 'dev-b',
  projectId: 'parcel-b',
  deviceId: 'hw-2',
};

const readingA: SensorReading = {
  id: 'r-a',
  deviceId: 'hw-1',
  projectId: 'parcel-a',
  timestamp: '2024-01-01T10:00:00Z',
  ph: 7.1,
  signature: 's',
  isVerified: true,
};

const readingB: SensorReading = {
  ...readingA,
  id: 'r-b',
  deviceId: 'hw-2',
  projectId: 'parcel-b',
  ph: 6.2,
};

const readingARt: SensorReading = {
  ...readingA,
  id: 'r-a-rt',
  timestamp: '2024-01-01T11:00:00Z',
  ph: 7.3,
};

describe('farmers-sensors selectors', () => {
  it('selectParcelsWithSensors joins per parcel without bleed', () => {
    const views = selectParcelsWithSensors.projector(
      [parcelA, parcelB],
      [deviceA, deviceB],
      { 'parcel-a': [readingA], 'parcel-b': [readingB] },
      [readingARt, readingB],
    );

    expect(views).toHaveLength(2);
    expect(views[0].devices.map((d) => d.id)).toEqual(['dev-a']);
    expect(views[0].readings.every((r) => r.projectId === 'parcel-a')).toBe(true);
    expect(views[0].readings.map((r) => r.id)).toContain('r-a-rt');
    expect(views[1].readings.every((r) => r.projectId === 'parcel-b')).toBe(true);
    expect(views[1].readings.map((r) => r.id)).not.toContain('r-a-rt');
  });

  it('selectParcelSensorView returns null for missing parcel', () => {
    expect(selectParcelSensorView('missing').projector(null, [], [])).toBeNull();
  });

  it('selectParcelSensorView scopes to one parcel', () => {
    const result = selectParcelSensorView('parcel-a').projector(
      parcelA,
      [deviceA],
      [readingA, readingARt],
    );
    expect(result?.parcel.id).toBe('parcel-a');
    expect(result?.devices).toHaveLength(1);
    expect(result?.readings.every((r) => r.projectId === 'parcel-a')).toBe(true);
  });
});
