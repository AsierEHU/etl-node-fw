export type RegisterStats = {
    registers_total: number
    registers_success: number
    registers_failed: number
    registers_invalid: number
    registers_skipped: number
}

export interface Report {
    getReport(config: any): Promise<any>
}
