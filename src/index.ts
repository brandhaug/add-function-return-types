#!/usr/bin/env node

import { main } from './cli.js'

void (async (): Promise<void> => {
	await main()
})()
