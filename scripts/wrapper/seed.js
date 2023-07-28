const fs = require('fs')
const n = require('eth-ens-namehash')
const envfile = require('envfile')
const sourcePath = './.env'
const packet = require('dns-packet')
const { utils, BigNumber: BN } = ethers
const { use, expect } = require('chai')
const { solidity } = require('ethereum-waffle')
const parsedFile = envfile.parse(fs.readFileSync('./.env'))

use(solidity)

const namehash = n.hash
const labelhash = (label) => utils.keccak256(utils.toUtf8Bytes(label))

function getOpenSeaUrl(contract, namehashedname){
  const tokenId = ethers.BigNumber.from(namehashedname).toString()
  return `https://testnets.opensea.io/assets/${contract}/${tokenId}`
}

async function main(a) {
    const [deployer] = await ethers.getSigners()
    const CAN_DO_EVERYTHING = 0
    const CANNOT_UNWRAP = 1
    const CANNOT_SET_RESOLVER = 8
    const firstAddress = deployer.address
    const {
      REGISTRY_ADDRESS:registryAddress,
      REGISTRAR_ADDRESS:registrarAddress,
      WRAPPER_ADDRESS:wrapperAddress,
      RESOLVER_ADDRESS:resolverAddress,
      SEED_NAME: name = 'wrappertest'
    } = parsedFile
    if(!(registryAddress && registrarAddress && wrapperAddress && resolverAddress)){
      throw('Set addresses on .env')
    } 
    console.log("Account balance:", (await deployer.getBalance()).toString())
    console.log({
      registryAddress,registrarAddress, wrapperAddress, resolverAddress,firstAddress, name
    })
    const SnsRegistry = await (await ethers.getContractFactory("SNSRegistry")).attach(registryAddress)
    const BaseRegistrar = await (await ethers.getContractFactory("BaseRegistrarImplementation")).attach(registrarAddress)
    const NameWrapper = await (await ethers.getContractFactory("NameWrapper")).attach(wrapperAddress)
    const Resolver = await (await ethers.getContractFactory("PublicResolver")).attach(resolverAddress)
    const domain = `${name}.scroll`
    const namehashedname = namehash(domain)
    
    await (await BaseRegistrar.setApprovalForAll(NameWrapper.address, true)).wait()
    await (await SnsRegistry.setApprovalForAll(NameWrapper.address, true)).wait()
    await (await NameWrapper.wrapETH2LD(name, firstAddress, CAN_DO_EVERYTHING)).wait()
    console.log(`Wrapped NFT for ${domain} is available at ${getOpenSeaUrl(NameWrapper.address, namehashedname)}`)
    await (await NameWrapper.setSubnodeOwnerAndWrap(namehash(`${name}.scroll`), 'sub1', firstAddress, CAN_DO_EVERYTHING)).wait()
    await (await NameWrapper.setSubnodeOwnerAndWrap(namehash(`${name}.scroll`), 'sub2', firstAddress, CAN_DO_EVERYTHING)).wait()
    await (await NameWrapper.setResolver(namehash(`sub2.${name}.scroll`), resolverAddress)).wait()
    await (await Resolver.setText(namehash(`sub2.${name}.scroll`), 'domains.scroll.nft.image', 'https://i.imgur.com/JcZESMp.png')).wait()
    console.log(`Wrapped NFT for sub2.${name}.scroll is available at ${getOpenSeaUrl(NameWrapper.address, namehash(`sub2.${name}.scroll`))}`)
    await (await NameWrapper.burnFuses(namehash(`sub2.${name}.scroll`),CANNOT_UNWRAP)).wait()
    await (await NameWrapper.burnFuses(namehash(`sub2.${name}.scroll`),CANNOT_SET_RESOLVER)).wait()
    await (await NameWrapper.unwrap(namehash(`${name}.scroll`), labelhash('sub1'), firstAddress)).wait()
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
