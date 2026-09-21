export interface TaskTypeProps {
  id: string;
  version: number;
  name: string;
  description?: string | undefined;
  defaultProofProfile: 'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF';
  isActive?: boolean | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export class TaskType {
  private readonly _id: string;
  private _version: number;
  private _name: string;
  private _description?: string | undefined;
  private _defaultProofProfile: 'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF';
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: TaskTypeProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('TaskType ID is required');
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('TaskType name is required');
    }

    this._id = props.id;
    this._version = props.version ?? 0;
    this._name = props.name;
    this._description = props.description;
    this._defaultProofProfile = props.defaultProofProfile;
    this._isActive = props.isActive ?? true;
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

  get description(): string | undefined {
    return this._description;
  }

  get defaultProofProfile(): 'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF' {
    return this._defaultProofProfile;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  activate(): void {
    if (this._isActive) {
      throw new Error('TaskType is already active');
    }
    this._isActive = true;
    this._version += 1;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (!this._isActive) {
      throw new Error('TaskType is already inactive');
    }
    this._isActive = false;
    this._version += 1;
    this._updatedAt = new Date();
  }
}
