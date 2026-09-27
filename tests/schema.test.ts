import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { CONFIG_KEYS, THEME_KEYS } from "../src/core/config/fields.ts"
import { THEME_COLOR_KEYS } from "../src/core/theme/catalog.ts"

const SCHEMA_PATH = join(import.meta.dirname, "../lixent.schema.json")

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readSchema(): Record<string, unknown> {
    const parsed: unknown = JSON.parse(readFileSync(SCHEMA_PATH, "utf-8"))
    assert.ok(isObject(parsed))
    return parsed
}

function readProperties(schema: Record<string, unknown>): Record<string, unknown> {
    const properties = schema.properties
    assert.ok(isObject(properties), "missing schema properties")
    return properties
}

describe("lixent.schema.json", () => {
    const schema = readSchema()

    it("declares required fields matching the parser", () => {
        assert.deepEqual(schema.required, ["copyright", "license"])
    })

    it("covers exactly the accepted top-level keys", () => {
        assert.deepEqual(Object.keys(readProperties(schema)).sort(), [...CONFIG_KEYS].sort())
    })

    it("covers exactly the accepted theme keys", () => {
        const theme = readProperties(schema).theme
        assert.ok(isObject(theme))
        assert.deepEqual(Object.keys(readProperties(theme)).sort(), [...THEME_KEYS].sort())
    })

    it("covers exactly the accepted color keys", () => {
        const theme = readProperties(schema).theme
        assert.ok(isObject(theme))
        const colors = readProperties(theme).colors
        assert.ok(isObject(colors))
        assert.deepEqual(Object.keys(readProperties(colors)).sort(), [...THEME_COLOR_KEYS].sort())
    })
})
