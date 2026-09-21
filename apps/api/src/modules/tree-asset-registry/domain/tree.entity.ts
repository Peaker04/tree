export interface TreeProps {
  id: string;
  version: number;
  name: string;
  species: string;
  lat: number;
  lng: number;
  address: string;
  qrCode: string;
  healthStatus: string;
  ageYears: number;
  riskStatus?: string | undefined;
  isRetired?: boolean | undefined;
  retiredAt?: Date | undefined;
  retiredReason?: string | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export class Tree {
  private readonly _id: string;
  private _version: number;
  private _name: string;
  private _species: string;
  private _lat: number;
  private _lng: number;
  private _address: string;
  private _qrCode: string;
  private _healthStatus: string;
  private _ageYears: number;
  private _riskStatus?: string | undefined;
  private _isRetired: boolean;
  private _retiredAt?: Date | undefined;
  private _retiredReason?: string | undefined;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: TreeProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('Tree ID is required and immutable');
    }
    if (!props.qrCode || props.qrCode.trim().length === 0) {
      throw new Error('QR code is required');
    }
    if (props.lat < -90 || props.lat > 90) {
      throw new Error('Invalid latitude');
    }
    if (props.lng < -180 || props.lng > 180) {
      throw new Error('Invalid longitude');
    }

    this._id = props.id;
    this._version = props.version ?? 0;
    this._name = props.name;
    this._species = props.species;
    this._lat = props.lat;
    this._lng = props.lng;
    this._address = props.address;
    this._qrCode = props.qrCode;
    this._healthStatus = props.healthStatus;
    this._ageYears = props.ageYears;
    this._riskStatus = props.riskStatus;
    this._isRetired = props.isRetired ?? false;
    this._retiredAt = props.retiredAt;
    this._retiredReason = props.retiredReason;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }

  get version(): number {
    return this._version;
  }

  get name(): string {
    return this._name;
  }

  get species(): string {
    return this._species;
  }

  get lat(): number {
    return this._lat;
  }

  get lng(): number {
    return this._lng;
  }

  get address(): string {
    return this._address;
  }

  get qrCode(): string {
    return this._qrCode;
  }

  get healthStatus(): string {
    return this._healthStatus;
  }

  get ageYears(): number {
    return this._ageYears;
  }

  get riskStatus(): string | undefined {
    return this._riskStatus;
  }

  get isRetired(): boolean {
    return this._isRetired;
  }

  get retiredAt(): Date | undefined {
    return this._retiredAt;
  }

  get retiredReason(): string | undefined {
    return this._retiredReason;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateMasterData(props: {
    name?: string | undefined;
    species?: string | undefined;
    address?: string | undefined;
    healthStatus?: string | undefined;
    ageYears?: number | undefined;
    riskStatus?: string | undefined;
  }): void {
    if (this._isRetired) {
      throw new Error('Cannot modify a retired tree');
    }
    if (props.name) this._name = props.name;
    if (props.species) this._species = props.species;
    if (props.address) this._address = props.address;
    if (props.healthStatus) this._healthStatus = props.healthStatus;
    if (props.ageYears !== undefined) this._ageYears = props.ageYears;
    if (props.riskStatus) this._riskStatus = props.riskStatus;
    this._version += 1;
    this._updatedAt = new Date();
  }

  replaceQrCode(newQrCode: string): void {
    if (this._isRetired) {
      throw new Error('Cannot modify a retired tree');
    }
    if (!newQrCode || newQrCode.trim().length === 0) {
      throw new Error('New QR code must not be empty');
    }
    this._qrCode = newQrCode;
    this._version += 1;
    this._updatedAt = new Date();
  }

  updateCanonicalCoordinates(lat: number, lng: number): void {
    if (this._isRetired) {
      throw new Error('Cannot modify a retired tree');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid coordinates');
    }
    this._lat = lat;
    this._lng = lng;
    this._version += 1;
    this._updatedAt = new Date();
  }

  retire(reason: string): void {
    if (this._isRetired) {
      throw new Error('Tree is already retired');
    }
    if (!reason || reason.trim().length < 5) {
      throw new Error('Retirement reason must be at least 5 characters');
    }
    this._isRetired = true;
    this._retiredAt = new Date();
    this._retiredReason = reason;
    this._version += 1;
    this._updatedAt = new Date();
  }
}
