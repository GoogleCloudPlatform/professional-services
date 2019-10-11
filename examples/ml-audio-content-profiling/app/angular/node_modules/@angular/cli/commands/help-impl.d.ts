import { Command } from '../models/command';
import { Schema as HelpCommandSchema } from './help';
export declare class HelpCommand extends Command<HelpCommandSchema> {
    run(): Promise<void>;
}
