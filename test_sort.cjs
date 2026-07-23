const classes = [
  { level: 'Nursery 1', name: 'NURSERY 1' },
  { level: 'Junior Secondary', name: 'JSS 1' },
  { level: 'Lower Primary', name: 'PRIMARY 1' },
  { level: 'Lower Primary', name: 'PRIMARY 2' },
  { level: 'Senior Secondary', name: 'SS 2' },
  { level: 'Upper Primary', name: 'PRIMARY 4' },
  { level: 'Senior Secondary', name: 'SS 3' },
  { level: 'Nursery 2', name: 'NURSERY 2' },
  { level: 'Senior Secondary', name: 'SS 1' },
  { level: 'Upper Primary', name: 'PRIMARY 5' },
  { level: 'Junior Secondary', name: 'JSS 3' },
  { level: 'Junior Secondary', name: 'JSS2' },
  { level: 'Kindergarten', name: 'KINDERGARTEN' },
  { level: 'Middle Primary', name: 'PRIMARY 3' },
];

const levelWeights = {
  'Nursery': 1,
  'Nursery 1': 2,
  'Nursery 2': 3,
  'Kindergarten': 4,
  'Lower Primary': 5,
  'Primary': 6,
  'Middle Primary': 7,
  'Upper Primary': 8,
  'Junior Secondary': 9,
  'Senior Secondary': 10
};

const sortedClasses = classes.sort((a, b) => {
  const weightA = levelWeights[a.level] || 99;
  const weightB = levelWeights[b.level] || 99;
  if (weightA !== weightB) return weightA - weightB;
  return a.name.localeCompare(b.name);
});

console.log(sortedClasses.map(c => c.level + ' ' + c.name));
