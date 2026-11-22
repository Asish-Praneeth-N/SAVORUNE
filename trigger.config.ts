import { defineConfig } from '@trigger.dev/sdk/v3';

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF || 'replace_with_trigger_project_ref',
  dirs: ['./src/trigger'],
  maxDuration: 300,
});
