import {
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  DeploymentMap as DeploymentMapEvent,
  Mint as MintEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  PerformUpkeep as PerformUpkeepEvent,
  Transfer as TransferEvent,
  UpkeepCheck as UpkeepCheckEvent
} from "../generated/ETHVercel/ETHVercel"
import {
  Approval,
  ApprovalForAll,
  DeploymentMap,
  Mint,
  OwnershipTransferred,
  PerformUpkeep,
  Transfer,
  UpkeepCheck
} from "../generated/schema"

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.approved = event.params.approved
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.operator = event.params.operator
  entity.approved = event.params.approved

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDeploymentMap(event: DeploymentMapEvent): void {
  let entity = new DeploymentMap(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.record_repo_url = event.params.record.repo_url
  entity.record_data = event.params.record.data
  entity.record_tokenuri = event.params.record.tokenuri
  entity.record_owner = event.params.record.owner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMint(event: MintEvent): void {
  let entity = new Mint(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._to = event.params._to
  entity.uri = event.params.uri

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePerformUpkeep(event: PerformUpkeepEvent): void {
  let entity = new PerformUpkeep(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._timestamp = event.params._timestamp
  entity._counter = event.params._counter

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUpkeepCheck(event: UpkeepCheckEvent): void {
  let entity = new UpkeepCheck(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._timestamp = event.params._timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
