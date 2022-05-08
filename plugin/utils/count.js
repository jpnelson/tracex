export function count(results, type, name, field, amount = 1) {
  results[`${type}.${name}`] = results[`${type}.${name}`] || {
    timeTotal: 0,
    samplesPresent: 0,
    sampleTotal: 0,
  };
  results[`${type}.${name}`][field] += amount;
}
