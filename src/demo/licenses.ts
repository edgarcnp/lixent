import type { LicenseData } from "./licenses.ts"

import MIT from "../data/licenses/MIT.json"
import Apache20 from "../data/licenses/Apache-2.0.json"
import BSD2Clause from "../data/licenses/BSD-2-Clause.json"
import BSD3Clause from "../data/licenses/BSD-3-Clause.json"
import ISC from "../data/licenses/ISC.json"
import MPL20 from "../data/licenses/MPL-2.0.json"
import GPL20Only from "../data/licenses/GPL-2.0-only.json"
import GPL30Only from "../data/licenses/GPL-3.0-only.json"
import LGPL21Only from "../data/licenses/LGPL-2.1-only.json"
import LGPL30Only from "../data/licenses/LGPL-3.0-only.json"
import AGPL30Only from "../data/licenses/AGPL-3.0-only.json"
import Unlicense from "../data/licenses/Unlicense.json"
import CC010 from "../data/licenses/CC0-1.0.json"
import WTFPL from "../data/licenses/WTFPL.json"
import ZeroBSD from "../data/licenses/0BSD.json"

export type { LicenseData }

export const licenses: Record<string, LicenseData | undefined> = {
    MIT: MIT as LicenseData,
    "Apache-2.0": Apache20 as LicenseData,
    "BSD-2-Clause": BSD2Clause as LicenseData,
    "BSD-3-Clause": BSD3Clause as LicenseData,
    ISC: ISC as LicenseData,
    "MPL-2.0": MPL20 as LicenseData,
    "GPL-2.0-only": GPL20Only as LicenseData,
    "GPL-3.0-only": GPL30Only as LicenseData,
    "LGPL-2.1-only": LGPL21Only as LicenseData,
    "LGPL-3.0-only": LGPL30Only as LicenseData,
    "AGPL-3.0-only": AGPL30Only as LicenseData,
    Unlicense: Unlicense as LicenseData,
    "CC0-1.0": CC010 as LicenseData,
    WTFPL: WTFPL as LicenseData,
    "0BSD": ZeroBSD as LicenseData,
}
