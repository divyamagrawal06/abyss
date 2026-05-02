// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AbyssAttest
/// @notice Records on-chain attestations of AI-generated transaction interpretations.
///         Each attestation commits to the exact structured payload the AI model saw,
///         making the interpretation verifiable and tamper-evident.
///
///         This is NOT a price oracle or financial data source. It attests to the
///         canonical JSON payload hash that was sent to the LLM, nothing more.
contract AbyssAttest {
    /// @notice Emitted when a user attests to an AI interpretation.
    /// @param attester  The wallet address that submitted the attestation.
    /// @param contentId Identifies what was interpreted, e.g. keccak256(abi.encodePacked("tx", txHash)).
    /// @param contentHash keccak256 of the canonical JSON payload the LLM received (sorted keys, schema v1.0).
    /// @param meta      Freeform metadata string, e.g. "abyss:tx:v1.0".
    event Attested(
        address indexed attester,
        bytes32 indexed contentId,
        bytes32 contentHash,
        string meta
    );

    /// @notice Submit an attestation on-chain.
    /// @param contentId   keccak256 of the content identifier (e.g. "tx" + txHash bytes).
    /// @param contentHash keccak256 of the canonical JSON payload.
    /// @param meta        Short label for the attestation type, e.g. "abyss:tx:v1.0".
    function attest(
        bytes32 contentId,
        bytes32 contentHash,
        string calldata meta
    ) external {
        emit Attested(msg.sender, contentId, contentHash, meta);
    }
}
