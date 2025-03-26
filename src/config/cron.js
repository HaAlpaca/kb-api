/* eslint-disable no-console */
import cron from 'node-cron'

export const START_CRON_JOB = () => {
  const task = cron.schedule(
    '*/14 * * * *',
    () => {
      const date = new Date()
      console.log('Cron job is running at:', date.toUTCString())
    },
    {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh'
    }
  )

  task.start()
}
