export interface CheckResult {
    time: Date;
    execDuration: number;
    checkId: number;
    entityId: string;
    checkResult: string;
    exception: string;
    alerts: {};
    isSampled: boolean // True,  # By default we consider a check result sampled!
}
