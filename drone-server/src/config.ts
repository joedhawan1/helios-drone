export const config = {
  port: Number(process.env.PORT ?? 8080),
  // Empty string = no auth required; all connections auto-authenticated
  accessCode: process.env.ACCESS_CODE ?? '',
  // BCM pin 18 = physical pin 12 on the Raspberry Pi 40-pin header
  ledPin: Number(process.env.LED_PIN ?? 18),
  // true when MOCK_GPIO=true or not running in production (dev machine / CI)
  mockGpio: process.env.MOCK_GPIO === 'true' || process.env.NODE_ENV !== 'production',
  // How long to keep the LED on after activation (ms). Default: 30 seconds.
  illuminateDurationMs: Number(process.env.ILLUMINATE_DURATION_MS ?? 30000),
  // Software PWM frequency in Hz for brightness control
  ledPwmFrequency: Number(process.env.LED_PWM_FREQ ?? 100),
};
