export type { LicenseData } from "../../data/licenses/index.ts"
import { licenses } from "../../data/licenses/index.ts"

export { licenses }

export const LICENSE_IDS = Object.keys(licenses).sort()
