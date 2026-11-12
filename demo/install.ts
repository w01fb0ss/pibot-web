// Evaluated before any app module: some of them read window.pibot when they load.
import { installDesktopDemo } from './fixtures';
installDesktopDemo();
