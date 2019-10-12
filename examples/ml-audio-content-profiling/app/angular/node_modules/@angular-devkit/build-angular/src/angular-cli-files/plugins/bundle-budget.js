"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bundle_calculator_1 = require("../utilities/bundle-calculator");
const stats_1 = require("../utilities/stats");
class BundleBudgetPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        const { budgets } = this.options;
        compiler.hooks.afterEmit.tap('BundleBudgetPlugin', (compilation) => {
            if (!budgets || budgets.length === 0) {
                return;
            }
            budgets.map(budget => {
                const thresholds = this.calculate(budget);
                return {
                    budget,
                    thresholds,
                    sizes: bundle_calculator_1.calculateSizes(budget, compilation),
                };
            })
                .forEach(budgetCheck => {
                budgetCheck.sizes.forEach(size => {
                    this.checkMaximum(budgetCheck.thresholds.maximumWarning, size, compilation.warnings);
                    this.checkMaximum(budgetCheck.thresholds.maximumError, size, compilation.errors);
                    this.checkMinimum(budgetCheck.thresholds.minimumWarning, size, compilation.warnings);
                    this.checkMinimum(budgetCheck.thresholds.minimumError, size, compilation.errors);
                    this.checkMinimum(budgetCheck.thresholds.warningLow, size, compilation.warnings);
                    this.checkMaximum(budgetCheck.thresholds.warningHigh, size, compilation.warnings);
                    this.checkMinimum(budgetCheck.thresholds.errorLow, size, compilation.errors);
                    this.checkMaximum(budgetCheck.thresholds.errorHigh, size, compilation.errors);
                });
            });
        });
    }
    checkMinimum(threshold, size, messages) {
        if (threshold) {
            if (threshold > size.size) {
                const sizeDifference = stats_1.formatSize(threshold - size.size);
                messages.push(`budgets, minimum exceeded for ${size.label}. `
                    + `Budget ${stats_1.formatSize(threshold)} was not reached by ${sizeDifference}.`);
            }
        }
    }
    checkMaximum(threshold, size, messages) {
        if (threshold) {
            if (threshold < size.size) {
                const sizeDifference = stats_1.formatSize(size.size - threshold);
                messages.push(`budgets, maximum exceeded for ${size.label}. `
                    + `Budget ${stats_1.formatSize(threshold)} was exceeded by ${sizeDifference}.`);
            }
        }
    }
    calculate(budget) {
        const thresholds = {};
        if (budget.maximumWarning) {
            thresholds.maximumWarning = bundle_calculator_1.calculateBytes(budget.maximumWarning, budget.baseline, 1);
        }
        if (budget.maximumError) {
            thresholds.maximumError = bundle_calculator_1.calculateBytes(budget.maximumError, budget.baseline, 1);
        }
        if (budget.minimumWarning) {
            thresholds.minimumWarning = bundle_calculator_1.calculateBytes(budget.minimumWarning, budget.baseline, -1);
        }
        if (budget.minimumError) {
            thresholds.minimumError = bundle_calculator_1.calculateBytes(budget.minimumError, budget.baseline, -1);
        }
        if (budget.warning) {
            thresholds.warningLow = bundle_calculator_1.calculateBytes(budget.warning, budget.baseline, -1);
        }
        if (budget.warning) {
            thresholds.warningHigh = bundle_calculator_1.calculateBytes(budget.warning, budget.baseline, 1);
        }
        if (budget.error) {
            thresholds.errorLow = bundle_calculator_1.calculateBytes(budget.error, budget.baseline, -1);
        }
        if (budget.error) {
            thresholds.errorHigh = bundle_calculator_1.calculateBytes(budget.error, budget.baseline, 1);
        }
        return thresholds;
    }
}
exports.BundleBudgetPlugin = BundleBudgetPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLWJ1ZGdldC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYW5ndWxhci1jbGktZmlsZXMvcGx1Z2lucy9idW5kbGUtYnVkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBU0Esc0VBQXNGO0FBQ3RGLDhDQUFnRDtBQWlCaEQsTUFBYSxrQkFBa0I7SUFDN0IsWUFBb0IsT0FBa0M7UUFBbEMsWUFBTyxHQUFQLE9BQU8sQ0FBMkI7SUFBSSxDQUFDO0lBRTNELEtBQUssQ0FBQyxRQUFrQjtRQUN0QixNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNqQyxRQUFRLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxXQUFvQyxFQUFFLEVBQUU7WUFDMUYsSUFBSSxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDcEMsT0FBTzthQUNSO1lBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDbkIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFMUMsT0FBTztvQkFDTCxNQUFNO29CQUNOLFVBQVU7b0JBQ1YsS0FBSyxFQUFFLGtDQUFjLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQztpQkFDM0MsQ0FBQztZQUNKLENBQUMsQ0FBQztpQkFDQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQ3JCLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUMvQixJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3JGLElBQUksQ0FB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WUFBWSxHQUFHLGtDQUFjLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDcEY7UUFFRCxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUU7WUFDbEIsVUFBVSxDQUFDLFVBQVUsR0FBRyxrQ0FBYyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzdFO1FBRUQsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFO1lBQ2xCLFVBQVUsQ0FBQyxXQUFXLEdBQUcsa0NBQWMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDN0U7UUFFRCxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUU7WUFDaEIsVUFBVSxDQUFDLFFBQVEsR0FBRyxrQ0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3pFO1FBRUQsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFO1lBQ2hCLFVBQVUsQ0FBQyxTQUFTLEdBQUcsa0NBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDekU7UUFFRCxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUEzRkQsZ0RBMkZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgQ29tcGlsZXIsIGNvbXBpbGF0aW9uIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBCdWRnZXQgfSBmcm9tICcuLi8uLi9icm93c2VyL3NjaGVtYSc7XG5pbXBvcnQgeyBTaXplLCBjYWxjdWxhdGVCeXRlcywgY2FsY3VsYXRlU2l6ZXMgfSBmcm9tICcuLi91dGlsaXRpZXMvYnVuZGxlLWNhbGN1bGF0b3InO1xuaW1wb3J0IHsgZm9ybWF0U2l6ZSB9IGZyb20gJy4uL3V0aWxpdGllcy9zdGF0cyc7XG5cbmludGVyZmFjZSBUaHJlc2hvbGRzIHtcbiAgbWF4aW11bVdhcm5pbmc/OiBudW1iZXI7XG4gIG1heGltdW1FcnJvcj86IG51bWJlcjtcbiAgbWluaW11bVdhcm5pbmc/OiBudW1iZXI7XG4gIG1pbmltdW1FcnJvcj86IG51bWJlcjtcbiAgd2FybmluZ0xvdz86IG51bWJlcjtcbiAgd2FybmluZ0hpZ2g/OiBudW1iZXI7XG4gIGVycm9yTG93PzogbnVtYmVyO1xuICBlcnJvckhpZ2g/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQnVuZGxlQnVkZ2V0UGx1Z2luT3B0aW9ucyB7XG4gIGJ1ZGdldHM6IEJ1ZGdldFtdO1xufVxuXG5leHBvcnQgY2xhc3MgQnVuZGxlQnVkZ2V0UGx1Z2luIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBvcHRpb25zOiBCdW5kbGVCdWRnZXRQbHVnaW5PcHRpb25zKSB7IH1cblxuICBhcHBseShjb21waWxlcjogQ29tcGlsZXIpOiB2b2lkIHtcbiAgICBjb25zdCB7IGJ1ZGdldHMgfSA9IHRoaXMub3B0aW9ucztcbiAgICBjb21waWxlci5ob29rcy5hZnRlckVtaXQudGFwKCdCdW5kbGVCdWRnZXRQbHVnaW4nLCAoY29tcGlsYXRpb246IGNvbXBpbGF0aW9uLkNvbXBpbGF0aW9uKSA9PiB7XG4gICAgICBpZiAoIWJ1ZGdldHMgfHwgYnVkZ2V0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBidWRnZXRzLm1hcChidWRnZXQgPT4ge1xuICAgICAgICBjb25zdCB0aHJlc2hvbGRzID0gdGhpcy5jYWxjdWxhdGUoYnVkZ2V0KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGJ1ZGdldCxcbiAgICAgICAgICB0aHJlc2hvbGRzLFxuICAgICAgICAgIHNpemVzOiBjYWxjdWxhdGVTaXplcyhidWRnZXQsIGNvbXBpbGF0aW9uKSxcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gICAgICAgIC5mb3JFYWNoKGJ1ZGdldENoZWNrID0+IHtcbiAgICAgICAgICBidWRnZXRDaGVjay5zaXplcy5mb3JFYWNoKHNpemUgPT4ge1xuICAgICAgICAgICAgdGhpcy5jaGVja01heGltdW0oYnVkZ2V0Q2hlY2sudGhyZXNob2xkcy5tYXhpbXVtV2FybmluZywgc2l6ZSwgY29tcGlsYXRpb24ud2FybmluZ3MpO1xuICAgICAgICAgICAgdGhpcy5jaGVja01heGltdW0oYnVkZ2V0Q2hlY2sudGhyZXNob2xkcy5tYXhpbXVtRXJyb3IsIHNpemUsIGNvbXBpbGF0aW9uLmVycm9ycyk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrTWluaW11bShidWRnZXRDaGVjay50aHJlc2hvbGRzLm1pbmltdW1XYXJuaW5nLCBzaXplLCBjb21waWxhdGlvbi53YXJuaW5ncyk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrTWluaW11bShidWRnZXRDaGVjay50aHJlc2hvbGRzLm1pbmltdW1FcnJvciwgc2l6ZSwgY29tcGlsYXRpb24uZXJyb3JzKTtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tNaW5pbXVtKGJ1ZGdldENoZWNrLnRocmVzaG9sZHMud2FybmluZ0xvdywgc2l6ZSwgY29tcGlsYXRpb24ud2FybmluZ3MpO1xuICAgICAgICAgICAgdGhpcy5jaGVja01heGltdW0oYnVkZ2V0Q2hlY2sudGhyZXNob2xkcy53YXJuaW5nSGlnaCwgc2l6ZSwgY29tcGlsYXRpb24ud2FybmluZ3MpO1xuICAgICAgICAgICAgdGhpcy5jaGVja01pbmltdW0oYnVkZ2V0Q2hlY2sudGhyZXNob2xkcy5lcnJvckxvdywgc2l6ZSwgY29tcGlsYXRpb24uZXJyb3JzKTtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tNYXhpbXVtKGJ1ZGdldENoZWNrLnRocmVzaG9sZHMuZXJyb3JIaWdoLCBzaXplLCBjb21waWxhdGlvbi5lcnJvcnMpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjaGVja01pbmltdW0odGhyZXNob2xkOiBudW1iZXIgfCB1bmRlZmluZWQsIHNpemU6IFNpemUsIG1lc3NhZ2VzOiBzdHJpbmdbXSkge1xuICAgIGlmICh0aHJlc2hvbGQpIHtcbiAgICAgIGlmICh0aHJlc2hvbGQgPiBzaXplLnNpemUpIHtcbiAgICAgICAgY29uc3Qgc2l6ZURpZmZlcmVuY2UgPSBmb3JtYXRTaXplKHRocmVzaG9sZCAtIHNpemUuc2l6ZSk7XG4gICAgICAgIG1lc3NhZ2VzLnB1c2goYGJ1ZGdldHMsIG1pbmltdW0gZXhjZWVkZWQgZm9yICR7c2l6ZS5sYWJlbH0uIGBcbiAgICAgICAgICArIGBCdWRnZXQgJHtmb3JtYXRTaXplKHRocmVzaG9sZCl9IHdhcyBub3QgcmVhY2hlZCBieSAke3NpemVEaWZmZXJlbmNlfS5gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNoZWNrTWF4aW11bSh0aHJlc2hvbGQ6IG51bWJlciB8IHVuZGVmaW5lZCwgc2l6ZTogU2l6ZSwgbWVzc2FnZXM6IHN0cmluZ1tdKSB7XG4gICAgaWYgKHRocmVzaG9sZCkge1xuICAgICAgaWYgKHRocmVzaG9sZCA8IHNpemUuc2l6ZSkge1xuICAgICAgICBjb25zdCBzaXplRGlmZmVyZW5jZSA9IGZvcm1hdFNpemUoc2l6ZS5zaXplIC0gdGhyZXNob2xkKTtcbiAgICAgICAgbWVzc2FnZXMucHVzaChgYnVkZ2V0cywgbWF4aW11bSBleGNlZWRlZCBmb3IgJHtzaXplLmxhYmVsfS4gYFxuICAgICAgICAgICsgYEJ1ZGdldCAke2Zvcm1hdFNpemUodGhyZXNob2xkKX0gd2FzIGV4Y2VlZGVkIGJ5ICR7c2l6ZURpZmZlcmVuY2V9LmApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlKGJ1ZGdldDogQnVkZ2V0KTogVGhyZXNob2xkcyB7XG4gICAgY29uc3QgdGhyZXNob2xkczogVGhyZXNob2xkcyA9IHt9O1xuICAgIGlmIChidWRnZXQubWF4aW11bVdhcm5pbmcpIHtcbiAgICAgIHRocmVzaG9sZHMubWF4aW11bVdhcm5pbmcgPSBjYWxjdWxhdGVCeXRlcyhidWRnZXQubWF4aW11bVdhcm5pbmcsIGJ1ZGdldC5iYXNlbGluZSwgMSk7XG4gICAgfVxuXG4gICAgaWYgKGJ1ZGdldC5tYXhpbXVtRXJyb3IpIHtcbiAgICAgIHRocmVzaG9sZHMubWF4aW11bUVycm9yID0gY2FsY3VsYXRlQnl0ZXMoYnVkZ2V0Lm1heGltdW1FcnJvciwgYnVkZ2V0LmJhc2VsaW5lLCAxKTtcbiAgICB9XG5cbiAgICBpZiAoYnVkZ2V0Lm1pbmltdW1XYXJuaW5nKSB7XG4gICAgICB0aHJlc2hvbGRzLm1pbmltdW1XYXJuaW5nID0gY2FsY3VsYXRlQnl0ZXMoYnVkZ2V0Lm1pbmltdW1XYXJuaW5nLCBidWRnZXQuYmFzZWxpbmUsIC0xKTtcbiAgICB9XG5cbiAgICBpZiAoYnVkZ2V0Lm1pbmltdW1FcnJvcikge1xuICAgICAgdGhyZXNob2xkcy5taW5pbXVtRXJyb3IgPSBjYWxjdWxhdGVCeXRlcyhidWRnZXQubWluaW11bUVycm9yLCBidWRnZXQuYmFzZWxpbmUsIC0xKTtcbiAgICB9XG5cbiAgICBpZiAoYnVkZ2V0Lndhcm5pbmcpIHtcbiAgICAgIHRocmVzaG9sZHMud2FybmluZ0xvdyA9IGNhbGN1bGF0ZUJ5dGVzKGJ1ZGdldC53YXJuaW5nLCBidWRnZXQuYmFzZWxpbmUsIC0xKTtcbiAgICB9XG5cbiAgICBpZiAoYnVkZ2V0Lndhcm5pbmcpIHtcbiAgICAgIHRocmVzaG9sZHMud2FybmluZ0hpZ2ggPSBjYWxjdWxhdGVCeXRlcyhidWRnZXQud2FybmluZywgYnVkZ2V0LmJhc2VsaW5lLCAxKTtcbiAgICB9XG5cbiAgICBpZiAoYnVkZ2V0LmVycm9yKSB7XG4gICAgICB0aHJlc2hvbGRzLmVycm9yTG93ID0gY2FsY3VsYXRlQnl0ZXMoYnVkZ2V0LmVycm9yLCBidWRnZXQuYmFzZWxpbmUsIC0xKTtcbiAgICB9XG5cbiAgICBpZiAoYnVkZ2V0LmVycm9yKSB7XG4gICAgICB0aHJlc2hvbGRzLmVycm9ySGlnaCA9IGNhbGN1bGF0ZUJ5dGVzKGJ1ZGdldC5lcnJvciwgYnVkZ2V0LmJhc2VsaW5lLCAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhyZXNob2xkcztcbiAgfVxufVxuIl19