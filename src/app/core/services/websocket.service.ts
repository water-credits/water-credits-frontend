import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { LoggingService } from './logging.service';
import { SensorReading, SensorAlert } from '../models/sensor-reading.model';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket: Socket | null = null;
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();
  
  // Cache of subjects for event streams to survive reconnections
  private eventSubjects = new Map<string, Subject<any>>();

  constructor(private loggingService: LoggingService) {}

  connect(token: string, userId: string): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(`${environment.wsUrl}/notifications`, {
      query: { token, userId },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: false, // Disable built-in reconnection, handled by effects
    });

    this.socket.on('connect', () => {
      this.connectedSubject.next(true);
      this.loggingService.info('Connected to WebSocket');
      
      // Re-bind all active subjects to the new socket
      this.eventSubjects.forEach((subject, event) => {
        this.socket!.on(event, (data) => subject.next(data));
      });
    });

    this.socket.on('disconnect', () => {
      this.connectedSubject.next(false);
      this.loggingService.info('Disconnected from WebSocket');
    });

    this.socket.on('connect_error', (error) => {
      this.loggingService.error('WebSocket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<T = unknown>(event: string): Observable<T> {
    if (!this.eventSubjects.has(event)) {
      const subject = new Subject<T>();
      this.eventSubjects.set(event, subject);
      
      if (this.socket && this.socket.connected) {
        this.socket.on(event, (data: T) => subject.next(data));
      }
    }
    
    return this.eventSubjects.get(event)!.asObservable();
  }

  emit(event: string, data?: unknown): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  get sensorReadings$(): Observable<SensorReading> {
    return this.on<SensorReading>('sensor:reading');
  }

  get sensorAlerts$(): Observable<SensorAlert> {
    return this.on<SensorAlert>('sensor:alert');
  }

  subscribeToProject(projectId: string): void {
    this.emit('subscribe:project', { projectId });
  }

  unsubscribeFromProject(projectId: string): void {
    this.emit('unsubscribe:project', { projectId });
  }
}
