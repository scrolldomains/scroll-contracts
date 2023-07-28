import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  await deploy('SNSRegistry', {
    from: deployer,
    args: [],
    log: true,
  })

  if (!network.tags.use_root) {
    const registry = await ethers.getContract('SNSRegistry')
    const rootOwner = await registry.owner(ZERO_HASH)
    switch (rootOwner) {
      case deployer:
        const tx = await registry.setOwner(ZERO_HASH, owner, { from: deployer })
        console.log('Setting final owner of root node on registry (tx:${tx.hash})...')
        await tx.wait()
        break
      case owner:
        break
      default:
        console.log(`WARNING: SNS registry root is owned by ${rootOwner}; cannot transfer to owner`)
    }
  }

  return true
}

func.id = 'sns'
func.tags = ['SNSRegistry']

export default func
