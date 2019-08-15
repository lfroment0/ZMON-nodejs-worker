
export default interface Alert {
    id: number;
    name: string;
    priority: number;
    parameters: string;
    team: string;
    tags: string[];
    checkId: number;
    period: string;
    notification: string[];
    condition: string;
}
