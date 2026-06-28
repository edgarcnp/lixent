/**
 * Config validation.
 *
 * Validates a fully-coerced LixentConfig against security constraints.
 * Throws on invalid values, warns on non-critical issues.
 *
 * @module
 */

import type { LixentConfig } from "../types.ts"
import { ConfigError } from "../errors.ts"
import { isValidTheme, THEME_VARIABLES } from "../../themes/index.ts"
import {
    assertValidUrl,
    assertValidEmail,
    assertValidFont,
    assertValidCopyright,
    assertValidYear,
    assertValidCustomName,
    assertValidCustomText,
    assertValidThemeOverrides,
    assertValidCssValue,
    assertValidCustomTheme,
} from "../validation.ts"

/**
 * Validates a config object against security constraints.
 *
 * @throws {ConfigError} If any validation check fails.
 */
export function validateConfig(config: LixentConfig): void {
    if (config.license === "custom") {
        const hasText = config.customLicense?.text != null && config.customLicense.text.length > 0
        const hasFile = config.licenseFile != null && config.licenseFile.length > 0
        if (!hasText && !hasFile) {
            throw new ConfigError(
                '[lixent] License is "custom" but neither customLicense.text nor licenseFile is set.',
            )
        }
    }

    assertValidCopyright(config.copyright)
    if (config.url != null) assertValidUrl(config.url)
    if (config.email != null) assertValidEmail(config.email)
    if (config.theme === "custom") {
        if (config.customTheme == null) {
            throw new ConfigError('[lixent] Theme is "custom" but customTheme is not set.')
        }
        assertValidCustomTheme(config.customTheme)
    } else if (!isValidTheme(config.theme) && !config.theme.startsWith("/")) {
        throw new ConfigError(
            `[lixent] Unknown theme "${config.theme}". `
          + `Use a built-in theme ID or an absolute path starting with "/" (e.g. "/my-theme.css").`,
        )
    }
    if (config.font != null) assertValidFont(config.font)
    if (config.fontSize != null) assertValidCssValue(config.fontSize, "fontSize")
    if (config.fontWeight != null) assertValidCssValue(config.fontWeight, "fontWeight")
    if (config.lineHeight != null) assertValidCssValue(config.lineHeight, "lineHeight")
    if (config.letterSpacing != null) assertValidCssValue(config.letterSpacing, "letterSpacing")
    if (config.year != null) assertValidYear(config.year)
    if (config.yearRange != null) {
        assertValidYear(config.yearRange.start)
        assertValidYear(config.yearRange.end)
        if (config.yearRange.start > config.yearRange.end) {
            throw new ConfigError(
                `[lixent] yearRange.start (${config.yearRange.start}) must not exceed `
              + `yearRange.end (${config.yearRange.end})`,
            )
        }
    }
    if (config.year != null && config.yearRange != null) {
        throw new ConfigError("[lixent] Both `year` and `yearRange` are set. Use only one.")
    }
    if (config.customLicense?.name != null) assertValidCustomName(config.customLicense.name)
    if (config.customLicense?.text != null) assertValidCustomText(config.customLicense.text)
    if (config.themeOverrides != null) {
        assertValidThemeOverrides(config.themeOverrides, THEME_VARIABLES)
    }
}
