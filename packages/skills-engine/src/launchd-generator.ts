import path from 'node:path';

export class LaunchdGenerator {
  static generatePlist(projectRoot: string, nodePath: string = '/usr/local/bin/node'): string {
    const scriptPath = path.join(projectRoot, 'packages', 'skills-engine', 'dist', 'cli.js');
    const logPath = path.join(projectRoot, 'packages', 'skills-engine', 'daemon.log');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.trautslab.os.scheduler</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${scriptPath}</string>
        <string>cron</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${path.join(projectRoot, 'packages', 'skills-engine')}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${logPath}</string>
    <key>StandardErrorPath</key>
    <string>${logPath}</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin</string>
    </dict>
</dict>
</plist>
`;
  }
}
