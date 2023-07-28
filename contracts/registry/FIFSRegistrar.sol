pragma solidity >=0.8.4;

import "./SNS.sol";

/**
 * A registrar that allocates subdomains to the first person to claim them.
 */
contract FIFSRegistrar {
    SNS sns;
    bytes32 rootNode;

    modifier only_owner(bytes32 label) {
        address currentOwner = sns.owner(
            keccak256(abi.encodePacked(rootNode, label))
        );
        require(currentOwner == address(0x0) || currentOwner == msg.sender);
        _;
    }

    /**
     * Constructor.
     * @param snsAddr The address of the SNS registry.
     * @param node The node that this registrar administers.
     */
    constructor(SNS snsAddr, bytes32 node) public {
        sns = snsAddr;
        rootNode = node;
    }

    /**
     * Register a name, or change the owner of an existing registration.
     * @param label The hash of the label to register.
     * @param owner The address of the new owner.
     */
    function register(bytes32 label, address owner) public only_owner(label) {
        sns.setSubnodeOwner(rootNode, label, owner);
    }
}
