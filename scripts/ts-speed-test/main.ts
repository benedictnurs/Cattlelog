const url1 = "https://pub-eddfeb0c3bbf40e3b5b3807336a6bdbc.r2.dev/all_courses.9.json.gz";
const url2 = "https://pub-eddfeb0c3bbf40e3b5b3807336a6bdbc.r2.dev/all_courses.6.json.gz";

const n = 40;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Measure times for each request
async function measureTimes(url: string, n: number): Promise<number[]> {
  const times: number[] = [];

  for (let i = 0; i < n; i++) {
    const start = performance.now();

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Request failed with status: ${response.status}`);
    } catch (error) {
      console.log(`Request failed: ${(error as Error).message}`);
      times.push(Infinity);
      continue;
    }

    const end = performance.now();
    times.push(end - start);
    console.log(`Request took: ${(end - start).toFixed(4)} ms`);
  }

  await sleep(5000);

  return times;
}

// Calculate mean and standard deviation
function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdev(values: number[], meanValue: number): number {
  const variance = values.reduce((sum, value) => sum + Math.pow(value - meanValue, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// Calculate t-test
function tTest(times1: number[], times2: number[]): { tStatistic: number, pValue: number } {
  const mean1 = mean(times1);
  const mean2 = mean(times2);
  const stdev1 = stdev(times1, mean1);
  const stdev2 = stdev(times2, mean2);

  const pooledVariance = Math.pow(stdev1, 2) / times1.length + Math.pow(stdev2, 2) / times2.length;
  const tStatistic = (mean1 - mean2) / Math.sqrt(pooledVariance);

  // For simplicity, using a rough approximation for p-value (use a statistical library for more precision)
  const pValue = 2 * (1 - Math.abs(tStatistic)); // This is an approximation

  return { tStatistic, pValue };
}

// Main function to measure times and run analysis
async function runAnalysis() {
  console.log("Measuring URL 1...");
  const times1 = await measureTimes(url1, n);

  console.log("Measuring URL 2...");
  const times2 = await measureTimes(url2, n);

  const mean1 = mean(times1);
  const stdev1 = stdev(times1, mean1);

  const mean2 = mean(times2);
  const stdev2 = stdev(times2, mean2);

  console.log(`\nURL 1 (${url1})`);
  console.log(`Mean: ${mean1.toFixed(4)} ms, Std Dev: ${stdev1.toFixed(4)} ms`);

  console.log(`\nURL 2 (${url2})`);
  console.log(`Mean: ${mean2.toFixed(4)} ms, Std Dev: ${stdev2.toFixed(4)} ms`);

  const { tStatistic, pValue } = tTest(times1, times2);

  console.log(`\nTwo-sample t-test results:`);
  console.log(`t-statistic: ${tStatistic.toFixed(4)}`);
  console.log(`p-value: ${pValue.toFixed(4)}`);

  if (pValue < 0.05) {
    console.log("Statistically significant difference!");
  } else {
    console.log("No significant difference.");
  }
}

runAnalysis();
