#!/usr/bin/env node

import { main } from './cli'

void (async (): Promise<void> => {
	await main()
})()
