pragma circom 2.0.0;

include "comparators.circom";
include "gates.circom";

template PrivateDeployment() {
    // Public inputs
    signal input maxDistance;
    signal input maxResponseTime;
    signal input currentDistance;
    signal input currentResponseTime;

    // Private inputs
    signal input deploymentId;

    // Output
    signal output isAllowed;

    // Check if current distance is within max distance
    component distanceCheck = LessThan(32);
    distanceCheck.in[0] <== currentDistance;
    distanceCheck.in[1] <== maxDistance;

    // Check if response time is within max allowed time
    component responseCheck = LessThan(32);
    responseCheck.in[0] <== currentResponseTime;
    responseCheck.in[1] <== maxResponseTime;

    // Both conditions must be true to allow access
    component andGate = AND();
    andGate.a <== distanceCheck.out;
    andGate.b <== responseCheck.out;

    isAllowed <== andGate.out;
}

component main = PrivateDeployment();