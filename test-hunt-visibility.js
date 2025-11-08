/**
 * Test script for Hunt Visibility Logic
 * This tests all valid scenarios from the specification
 */

const validScenarios = [
  // Private + Hide from Public scenarios
  { name: "Private + Hide from Public + Paid + Hide Location", isPublic: false, hideFromPublic: true, isPaid: true, hideLocation: true, shouldPass: true },
  { name: "Private + Hide from Public + Paid + Unhide Location", isPublic: false, hideFromPublic: true, isPaid: true, hideLocation: false, shouldPass: true },
  { name: "Private + Hide from Public + Unpaid + Hide Location", isPublic: false, hideFromPublic: true, isPaid: false, hideLocation: true, shouldPass: true },
  { name: "Private + Hide from Public + Unpaid + Unhide Location", isPublic: false, hideFromPublic: true, isPaid: false, hideLocation: false, shouldPass: true },

  // Private + Unhide from Public scenarios
  { name: "Private + Unhide from Public + Paid + Hide Location", isPublic: false, hideFromPublic: false, isPaid: true, hideLocation: true, shouldPass: true },
  { name: "Private + Unhide from Public + Paid + Unhide Location", isPublic: false, hideFromPublic: false, isPaid: true, hideLocation: false, shouldPass: true },
  { name: "Private + Unhide from Public + Unpaid + Hide Location", isPublic: false, hideFromPublic: false, isPaid: false, hideLocation: true, shouldPass: true },
  { name: "Private + Unhide from Public + Unpaid + Unhide Location", isPublic: false, hideFromPublic: false, isPaid: false, hideLocation: false, shouldPass: true },

  // Public scenarios (hideFromPublic must be false)
  { name: "Public + Unhide from Public + Paid + Unhide Location", isPublic: true, hideFromPublic: false, isPaid: true, hideLocation: false, shouldPass: true },
  { name: "Public + Unhide from Public + Paid + Hide Location", isPublic: true, hideFromPublic: false, isPaid: true, hideLocation: true, shouldPass: true },
  { name: "Public + Unhide from Public + Unpaid + Unhide Location", isPublic: true, hideFromPublic: false, isPaid: false, hideLocation: false, shouldPass: true },
];

const invalidScenarios = [
  // Public with Hide from Public (should fail)
  { name: "INVALID: Public + Hide from Public + Paid + Hide Location", isPublic: true, hideFromPublic: true, isPaid: true, hideLocation: true, shouldPass: false },
  { name: "INVALID: Public + Hide from Public + Unpaid + Unhide Location", isPublic: true, hideFromPublic: true, isPaid: false, hideLocation: false, shouldPass: false },

  // Public + Unpaid with Hide Location (should fail - hideLocation requires isPaid OR isPrivate)
  { name: "INVALID: Public + Unhide from Public + Unpaid + Hide Location", isPublic: true, hideFromPublic: false, isPaid: false, hideLocation: true, shouldPass: false },
];

function validateScenario(scenario) {
  const { isPublic, hideFromPublic, isPaid, hideLocation } = scenario;

  // Rule 1: hideFromPublic can only be true when isPublic is false (Private mode)
  if (hideFromPublic && isPublic) {
    return { valid: false, reason: "hideFromPublic can only be enabled for private hunts" };
  }

  // Rule 2: hideLocation can only be true when isPaid OR !isPublic (Private)
  if (hideLocation && !isPaid && isPublic) {
    return { valid: false, reason: "hideLocation requires either Paid event or Private hunt" };
  }

  return { valid: true, reason: "Valid scenario" };
}

console.log("=".repeat(80));
console.log("TESTING VALID SCENARIOS");
console.log("=".repeat(80));

let validPassed = 0;
let validFailed = 0;

validScenarios.forEach((scenario, index) => {
  const result = validateScenario(scenario);
  const passed = result.valid === scenario.shouldPass;

  if (passed) {
    validPassed++;
    console.log(`✅ [${index + 1}/${validScenarios.length}] ${scenario.name}`);
  } else {
    validFailed++;
    console.log(`❌ [${index + 1}/${validScenarios.length}] ${scenario.name}`);
    console.log(`   Expected: ${scenario.shouldPass ? "PASS" : "FAIL"}, Got: ${result.valid ? "PASS" : "FAIL"}`);
    console.log(`   Reason: ${result.reason}`);
  }
});

console.log("\n" + "=".repeat(80));
console.log("TESTING INVALID SCENARIOS (Should be blocked)");
console.log("=".repeat(80));

let invalidPassed = 0;
let invalidFailed = 0;

invalidScenarios.forEach((scenario, index) => {
  const result = validateScenario(scenario);
  const passed = result.valid === scenario.shouldPass;

  if (passed) {
    invalidPassed++;
    console.log(`✅ [${index + 1}/${invalidScenarios.length}] ${scenario.name} - Correctly blocked`);
    console.log(`   Reason: ${result.reason}`);
  } else {
    invalidFailed++;
    console.log(`❌ [${index + 1}/${invalidScenarios.length}] ${scenario.name} - Should have been blocked!`);
    console.log(`   Expected: FAIL, Got: ${result.valid ? "PASS" : "FAIL"}`);
  }
});

console.log("\n" + "=".repeat(80));
console.log("SUMMARY");
console.log("=".repeat(80));
console.log(`Valid scenarios: ${validPassed}/${validScenarios.length} passed`);
console.log(`Invalid scenarios: ${invalidPassed}/${invalidScenarios.length} correctly blocked`);
console.log(`Total: ${validPassed + invalidPassed}/${validScenarios.length + invalidScenarios.length} tests passed`);

if (validFailed === 0 && invalidFailed === 0) {
  console.log("\n🎉 All tests passed! The logic is correct.");
  process.exit(0);
} else {
  console.log("\n❌ Some tests failed. Please review the logic.");
  process.exit(1);
}
