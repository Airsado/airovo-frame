import { registerAppLocales } from '@airovo/app'

registerAppLocales({ modules: import.meta.glob('./**/*.json') })
