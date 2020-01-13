import { Subject, BehaviorSubject, ReplaySubject } from 'rxjs';

type SubjectData = { action: string; data: string } | undefined;

export class Intent {
  private ws: WebSocket;
  private readonly name: string;

  private subject: Subject<SubjectData>;
  private statusSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public constructor(name: string, url: string = 'ws://localhost:1248/', options?: { cache: number }) {
    const { cache } = options || {};
    this.ws = new WebSocket(url);
    if (cache !== undefined) {
      if (cache === 1) {
        this.subject = new BehaviorSubject<SubjectData>(undefined);
      } else if (cache > 1) {
        this.subject = new ReplaySubject<SubjectData>(cache);
      } else {
        this.subject = new Subject<SubjectData>();
      }
    } else {
      this.subject = new Subject<SubjectData>();
    }

    this.name = name;
    this.ws.onopen = () => {
      console.log(`[${this.name}] open`);
      this.statusSubject.next(true);
      this.subject.subscribe(
        // 已连接之后才开始发送消息
        d => {
          if (d === undefined) {
            return;
          }
          const { action, data } = d as { action: string; data: string; source?: string };
          this.ws.send(JSON.stringify({ action, data, source: this.name }));
        },
        e => console.error(`[${name}] fail`, e),
        () => console.log(`[${name}] complete`),
      );
    };
    this.ws.onerror = ev => {
      console.log(`[${name}] error`, ev);
      this.statusSubject.complete();
      this.subject.complete();
    };
    this.ws.onclose = () => {
      console.log(`[${name}] close`);
      this.statusSubject.complete();
      this.subject.complete();
    };
  }

  public next(action: string, data: string) {
    this.subject.next({ action, data });
  }

  public close() {
    console.log(`[${this.name}] close`);
    this.ws.close();
    this.subject.complete();
    this.statusSubject.next(false);
    this.statusSubject.complete();
  }

  public getStatusSubject(): BehaviorSubject<boolean> {
    return this.statusSubject;
  }
}
