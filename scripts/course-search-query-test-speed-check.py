# NOTE: The new data (the most recent 30) don't all have the new speed async
# update, even this data still had an average speed increase which is
# especially impressive given that the data is still being averaged with like
# 25 other non updated versions. We will need to wait until 30 searches have
# been done to get the actual data to use for this experiment.

# Final Notes:
#
# Experimental Error:
# This test was conducted where the new data was a downgraded tier of the
# backend hosting and the old was a more upgraded version. That said, it likely
# did not affect the result much.
#
# Results:
# The new version is only 3% faster, and this is not statistically significant.
# We can keep the new version because it isn't slower, but this did not end up
# being a landmark speed improvement that it could have been. Usually doing
# large things asynchronously gives big speed improvements. The reason these
# speed improvements are not seen may be due to the hosting only having one
# CPU.

import pandas as pd
import json
import numpy as np
from io import StringIO
from scipy import stats
import matplotlib.pyplot as plt

# Load the data files
with open("./speed-time-async-test-new-100.csv") as file:
    csv_data_new = file.read()

with open("./speed-time-async-test-old-100.csv") as file:
    csv_data_old = file.read()

def parse_csv_data(csv_string):
    """Parse CSV data and return DataFrame"""
    return pd.read_csv(StringIO(csv_string))

def calculate_total_execution_time(df):
    """Calculate total execution time for each entry (start to finish)"""
    execution_times = []

    # Properties to exclude (non-timing properties)
    exclude_props = {
        '$lib', '$os', '$python_version', '$os_version', '$lib_version',
        '$python_runtime', '$geoip_disable', '$ip', '$set', '$set_once',
        '$transformations_succeeded'
    }

    for _, row in df.iterrows():
        try:
            # Parse the JSON properties
            properties = json.loads(row['properties'])

            # Extract only timing-related properties
            timing_values = []
            for key, value in properties.items():
                if key not in exclude_props and isinstance(value, (int, float)):
                    timing_values.append(value)

            if timing_values:
                # Calculate total execution time as the difference between
                # the earliest and latest timestamps
                total_time = max(timing_values) - min(timing_values)
                execution_times.append(total_time)

        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing properties: {e}")
            continue

    return np.array(execution_times)

def remove_outliers(data, method='iqr'):
    """Remove outliers using IQR method"""
    if len(data) < 5:  # Need at least 5 values for meaningful outlier detection
        return data

    q1 = np.percentile(data, 25)
    q3 = np.percentile(data, 75)
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr

    # Filter out outliers
    filtered_data = data[(data >= lower_bound) & (data <= upper_bound)]

    outliers_removed = len(data) - len(filtered_data)
    if outliers_removed > 0:
        print(f"Removed {outliers_removed} outliers from dataset")

    return filtered_data

def calculate_statistics(data, label):
    """Calculate comprehensive statistics for a dataset"""
    stats_dict = {
        'mean': np.mean(data),
        'median': np.median(data),
        'std': np.std(data, ddof=1),  # Sample standard deviation
        'min': np.min(data),
        'max': np.max(data),
        'q1': np.percentile(data, 25),
        'q3': np.percentile(data, 75),
        'iqr': np.percentile(data, 75) - np.percentile(data, 25),
        'count': len(data),
        'sem': stats.sem(data),  # Standard error of the mean
        'cv': np.std(data, ddof=1) / np.mean(data)  # Coefficient of variation
    }

    return stats_dict

def perform_two_sample_t_test(old_data, new_data):
    """Perform two-sample t-test"""
    # Perform Welch's t-test (assumes unequal variances)
    t_stat, p_value = stats.ttest_ind(old_data, new_data, equal_var=False)

    # Calculate effect size (Cohen's d)
    pooled_std = np.sqrt(((len(old_data) - 1) * np.var(old_data, ddof=1) +
                         (len(new_data) - 1) * np.var(new_data, ddof=1)) /
                        (len(old_data) + len(new_data) - 2))
    cohens_d = (np.mean(new_data) - np.mean(old_data)) / pooled_std

    return t_stat, p_value, cohens_d

def create_comparison_visualization(old_data, new_data, old_stats, new_stats):
    """Create visualization comparing the two datasets"""
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))

    # 1. Box plot comparison
    ax1.boxplot([old_data, new_data], labels=['Old', 'New'], patch_artist=True)
    boxes = ax1.findobj(plt.matplotlib.patches.PathPatch)
    boxes[0].set_facecolor('#e74c3c')
    boxes[1].set_facecolor('#3498db')
    ax1.set_title('Distribution Comparison', fontweight='bold')
    ax1.set_ylabel('Total Execution Time (seconds)')
    ax1.grid(True, alpha=0.3)

    # 2. Histogram comparison
    ax2.hist(old_data, bins=20, alpha=0.7, color='#e74c3c', label='Old', density=True)
    ax2.hist(new_data, bins=20, alpha=0.7, color='#3498db', label='New', density=True)
    ax2.set_title('Distribution Histograms', fontweight='bold')
    ax2.set_xlabel('Total Execution Time (seconds)')
    ax2.set_ylabel('Density')
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    # 3. Q-Q plot for normality check
    from scipy.stats import probplot
    probplot(old_data, dist="norm", plot=ax3)
    ax3.set_title('Q-Q Plot: Old Data vs Normal Distribution', fontweight='bold')
    ax3.grid(True, alpha=0.3)

    # 4. Q-Q plot for new data
    probplot(new_data, dist="norm", plot=ax4)
    ax4.set_title('Q-Q Plot: New Data vs Normal Distribution', fontweight='bold')
    ax4.grid(True, alpha=0.3)

    plt.tight_layout()
    return fig

def main():
    """Main analysis function"""
    print("="*80)
    print("OVERALL START-TO-FINISH PERFORMANCE ANALYSIS")
    print("="*80)

    # Parse CSV data
    df_new = parse_csv_data(csv_data_new)
    df_old = parse_csv_data(csv_data_old)

    print(f"Loaded {len(df_new)} new entries and {len(df_old)} old entries")

    # Calculate total execution times
    execution_times_new = calculate_total_execution_time(df_new)
    execution_times_old = calculate_total_execution_time(df_old)

    print(f"Extracted {len(execution_times_new)} new execution times and {len(execution_times_old)} old execution times")

    # Remove outliers
    print("\nRemoving outliers using IQR method...")
    execution_times_new_clean = remove_outliers(execution_times_new)
    execution_times_old_clean = remove_outliers(execution_times_old)

    print(f"Final dataset sizes: Old = {len(execution_times_old_clean)}, New = {len(execution_times_new_clean)}")

    # Calculate statistics
    old_stats = calculate_statistics(execution_times_old_clean, "Old")
    new_stats = calculate_statistics(execution_times_new_clean, "New")

    # Print detailed statistics
    print("\n" + "="*60)
    print("DESCRIPTIVE STATISTICS")
    print("="*60)
    print(f"{'Metric':<20} {'Old Implementation':<20} {'New Implementation':<20}")
    print("-" * 60)
    print(f"{'Mean':<20} {old_stats['mean']:<20.6f} {new_stats['mean']:<20.6f}")
    print(f"{'Median':<20} {old_stats['median']:<20.6f} {new_stats['median']:<20.6f}")
    print(f"{'Std Deviation':<20} {old_stats['std']:<20.6f} {new_stats['std']:<20.6f}")
    print(f"{'Min':<20} {old_stats['min']:<20.6f} {new_stats['min']:<20.6f}")
    print(f"{'Max':<20} {old_stats['max']:<20.6f} {new_stats['max']:<20.6f}")
    print(f"{'Q1 (25th %ile)':<20} {old_stats['q1']:<20.6f} {new_stats['q1']:<20.6f}")
    print(f"{'Q3 (75th %ile)':<20} {old_stats['q3']:<20.6f} {new_stats['q3']:<20.6f}")
    print(f"{'IQR':<20} {old_stats['iqr']:<20.6f} {new_stats['iqr']:<20.6f}")
    print(f"{'Count':<20} {old_stats['count']:<20} {new_stats['count']:<20}")
    print(f"{'Std Error':<20} {old_stats['sem']:<20.6f} {new_stats['sem']:<20.6f}")
    print(f"{'Coeff of Var':<20} {old_stats['cv']:<20.6f} {new_stats['cv']:<20.6f}")

    # Performance comparison
    print("\n" + "="*60)
    print("PERFORMANCE COMPARISON")
    print("="*60)
    mean_change = new_stats['mean'] - old_stats['mean']
    mean_change_pct = (mean_change / old_stats['mean']) * 100
    median_change = new_stats['median'] - old_stats['median']
    median_change_pct = (median_change / old_stats['median']) * 100

    print(f"Mean change: {mean_change:+.6f} seconds ({mean_change_pct:+.2f}%)")
    print(f"Median change: {median_change:+.6f} seconds ({median_change_pct:+.2f}%)")

    if mean_change < 0:
        print("✅ NEW implementation is FASTER on average")
    else:
        print("❌ NEW implementation is SLOWER on average")

    # Two-sample t-test
    print("\n" + "="*60)
    print("TWO-SAMPLE T-TEST RESULTS")
    print("="*60)

    t_stat, p_value, cohens_d = perform_two_sample_t_test(execution_times_old_clean, execution_times_new_clean)

    print(f"t-statistic: {t_stat:.6f}")
    print(f"p-value: {p_value:.6f}")
    print(f"Cohen's d (effect size): {cohens_d:.6f}")

    # Interpret results
    print("\nInterpretation:")
    if p_value < 0.001:
        print("*** HIGHLY SIGNIFICANT difference (p < 0.001)")
    elif p_value < 0.01:
        print("** VERY SIGNIFICANT difference (p < 0.01)")
    elif p_value < 0.05:
        print("* SIGNIFICANT difference (p < 0.05)")
    else:
        print("NO significant difference (p >= 0.05)")

    # Effect size interpretation
    abs_cohens_d = abs(cohens_d)
    if abs_cohens_d < 0.2:
        effect_size = "negligible"
    elif abs_cohens_d < 0.5:
        effect_size = "small"
    elif abs_cohens_d < 0.8:
        effect_size = "medium"
    else:
        effect_size = "large"

    print(f"Effect size: {effect_size} ({abs_cohens_d:.3f})")

    if cohens_d < 0:
        print("Direction: New implementation is faster")
    else:
        print("Direction: New implementation is slower")

    # Confidence interval for the difference in means
    print("\n" + "="*60)
    print("CONFIDENCE INTERVAL FOR MEAN DIFFERENCE")
    print("="*60)

    # Calculate 95% confidence interval
    pooled_se = np.sqrt(old_stats['sem']**2 + new_stats['sem']**2)
    df_welch = (old_stats['sem']**2 + new_stats['sem']**2)**2 / (
        (old_stats['sem']**2)**2 / (old_stats['count'] - 1) +
        (new_stats['sem']**2)**2 / (new_stats['count'] - 1)
    )

    t_critical = stats.t.ppf(0.975, df_welch)  # 95% confidence interval
    margin_of_error = t_critical * pooled_se

    ci_lower = mean_change - margin_of_error
    ci_upper = mean_change + margin_of_error

    print(f"95% Confidence Interval for mean difference: [{ci_lower:.6f}, {ci_upper:.6f}]")

    if ci_lower > 0:
        print("✅ We can be 95% confident that the new implementation is slower")
    elif ci_upper < 0:
        print("✅ We can be 95% confident that the new implementation is faster")
    else:
        print("❓ The confidence interval includes zero - difference may not be meaningful")

    # Create visualizations
    print("\nCreating visualizations...")
    fig = create_comparison_visualization(execution_times_old_clean, execution_times_new_clean,
                                        old_stats, new_stats)
    plt.show()

    # Summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"• Old implementation mean: {old_stats['mean']:.6f} ± {old_stats['std']:.6f} seconds")
    print(f"• New implementation mean: {new_stats['mean']:.6f} ± {new_stats['std']:.6f} seconds")
    print(f"• Difference: {mean_change:+.6f} seconds ({mean_change_pct:+.2f}%)")
    print(f"• Statistical significance: p = {p_value:.6f}")
    print(f"• Effect size: {effect_size} (Cohen's d = {cohens_d:.3f})")

    return {
        'old_stats': old_stats,
        'new_stats': new_stats,
        't_stat': t_stat,
        'p_value': p_value,
        'cohens_d': cohens_d,
        'old_data': execution_times_old_clean,
        'new_data': execution_times_new_clean
    }

if __name__ == "__main__":
    results = main()
