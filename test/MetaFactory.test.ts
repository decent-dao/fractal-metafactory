import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { ethers, network } from "hardhat";
import {
  DAO__factory,
  DAO,
  DAOFactory,
  DAOAccessControl,
  DAOAccessControl__factory,
  IMetaFactory__factory,
  MetaFactory,
  GovernorModule,
  GovernorModule__factory,
  GovernorFactory,
  TreasuryModule,
  TreasuryModule__factory,
  TreasuryModuleFactory,
  TimelockUpgradeable,
  TimelockUpgradeable__factory,
  TokenFactory,
  VotesTokenWithSupply,
  VotesTokenWithSupply__factory,
  MetaFactory__factory,
  DAOFactory__factory,
  TreasuryModuleFactory__factory,
  TokenFactory__factory,
  GovernorFactory__factory,
  ERC1967Proxy__factory,
} from "../typechain-types";
import getInterfaceSelector from "./helpers/getInterfaceSelector";
import {
  VoteType,
  govModPropose,
  delegateTokens,
} from "./helpers/governorModuleHelpers";

describe("MetaFactory", () => {
  // Factories
  let daoFactory: DAOFactory;
  let govFactory: GovernorFactory;
  let treasuryFactory: TreasuryModuleFactory;
  let metaFactory: MetaFactory;
  let tokenFactory: TokenFactory;

  // Impl
  let accessControlImpl: DAOAccessControl;
  let daoImpl: DAO;
  let govImpl: GovernorModule;
  let timelockImpl: TimelockUpgradeable;
  let treasuryImpl: TreasuryModule;

  // Deployed contracts
  let accessControl: DAOAccessControl;
  let dao: DAO;
  let govModule: GovernorModule;
  let treasuryModule: TreasuryModule;
  let timelock: TimelockUpgradeable;
  let token: VotesTokenWithSupply;

  // Wallets
  let deployer: SignerWithAddress;
  let upgrader: SignerWithAddress;
  let executor: SignerWithAddress;
  let withdrawer: SignerWithAddress;
  let userA: SignerWithAddress;

  let tx: ContractTransaction;

  beforeEach(async () => {
    [deployer, upgrader, executor, withdrawer, userA] =
      await ethers.getSigners();

    // Get deployed MetaFactory contract
    metaFactory = await new MetaFactory__factory(deployer).deploy();

    // Get deployed factory contracts
    daoFactory = await new DAOFactory__factory(deployer).deploy();
    treasuryFactory = await new TreasuryModuleFactory__factory(
      deployer
    ).deploy();
    tokenFactory = await new TokenFactory__factory(deployer).deploy();
    govFactory = await new GovernorFactory__factory(deployer).deploy();

    // Get deployed implementation contracts
    daoImpl = await new DAO__factory(deployer).deploy();
    accessControlImpl = await new DAOAccessControl__factory(deployer).deploy();
    treasuryImpl = await new TreasuryModule__factory(deployer).deploy();
    govImpl = await new GovernorModule__factory(deployer).deploy();
    timelockImpl = await new TimelockUpgradeable__factory(deployer).deploy();

    const abiCoder = new ethers.utils.AbiCoder();
    const { chainId } = await ethers.provider.getNetwork();

    const predictedDAOAddress = ethers.utils.getCreate2Address(
      daoFactory.address,
      ethers.utils.solidityKeccak256(
        ["address", "uint256", "bytes32"],
        [
          deployer.address,
          chainId,
          ethers.utils.formatBytes32String("randombytes"),
        ]
      ),
      ethers.utils.solidityKeccak256(
        ["bytes", "bytes"],
        [
          // eslint-disable-next-line camelcase
          ERC1967Proxy__factory.bytecode,
          abiCoder.encode(["address", "bytes"], [daoImpl.address, []]),
        ]
      )
    );

    const predictedAccessControlAddress = ethers.utils.getCreate2Address(
      daoFactory.address,
      ethers.utils.solidityKeccak256(
        ["address", "uint256", "bytes32"],
        [
          deployer.address,
          chainId,
          ethers.utils.formatBytes32String("randombytes"),
        ]
      ),
      ethers.utils.solidityKeccak256(
        ["bytes", "bytes"],
        [
          // eslint-disable-next-line camelcase
          ERC1967Proxy__factory.bytecode,
          abiCoder.encode(
            ["address", "bytes"],
            [accessControlImpl.address, []]
          ),
        ]
      )
    );

    const predictedTreasuryAddress = ethers.utils.getCreate2Address(
      treasuryFactory.address,
      ethers.utils.solidityKeccak256(
        ["address", "uint256", "bytes32"],
        [
          deployer.address,
          chainId,
          ethers.utils.formatBytes32String("treasurySalt"),
        ]
      ),
      ethers.utils.solidityKeccak256(
        ["bytes", "bytes"],
        [
          // eslint-disable-next-line camelcase
          ERC1967Proxy__factory.bytecode,
          abiCoder.encode(["address", "bytes"], [treasuryImpl.address, []]),
        ]
      )
    );

    const predictedTokenAddress = ethers.utils.getCreate2Address(
      tokenFactory.address,
      ethers.utils.solidityKeccak256(
        ["address", "uint256", "bytes32"],
        [
          deployer.address,
          chainId,
          ethers.utils.formatBytes32String("tokenSalt"),
        ]
      ),
      ethers.utils.solidityKeccak256(
        ["bytes", "bytes"],
        [
          // eslint-disable-next-line camelcase
          VotesTokenWithSupply__factory.bytecode,
          abiCoder.encode(
            ["string", "string", "address[]", "uint256[]"],
            [
              "DCNT",
              "DCNT",
              [predictedTreasuryAddress, userA.address],
              [1000, 1000],
            ]
          ),
        ]
      )
    );

    const predictedGovernorAddress = ethers.utils.getCreate2Address(
      govFactory.address,
      ethers.utils.solidityKeccak256(
        ["address", "uint256", "bytes32"],
        [
          deployer.address,
          chainId,
          ethers.utils.formatBytes32String("governorSalt"),
        ]
      ),
      ethers.utils.solidityKeccak256(
        ["bytes", "bytes"],
        [
          // eslint-disable-next-line camelcase
          ERC1967Proxy__factory.bytecode,
          abiCoder.encode(["address", "bytes"], [govImpl.address, []]),
        ]
      )
    );

    const predictedTimelockAddress = ethers.utils.getCreate2Address(
      govFactory.address,
      ethers.utils.solidityKeccak256(
        ["address", "uint256", "bytes32"],
        [
          deployer.address,
          chainId,
          ethers.utils.formatBytes32String("governorSalt"),
        ]
      ),
      ethers.utils.solidityKeccak256(
        ["bytes", "bytes"],
        [
          // eslint-disable-next-line camelcase
          ERC1967Proxy__factory.bytecode,
          abiCoder.encode(["address", "bytes"], [timelockImpl.address, []]),
        ]
      )
    );

    dao = await ethers.getContractAt("DAO", predictedDAOAddress);
    accessControl = await ethers.getContractAt(
      "DAOAccessControl",
      predictedAccessControlAddress
    );
    treasuryModule = await ethers.getContractAt(
      "TreasuryModule",
      predictedTreasuryAddress
    );
    token = await ethers.getContractAt(
      "VotesTokenWithSupply",
      predictedTokenAddress
    );
    govModule = await ethers.getContractAt(
      "GovernorModule",
      predictedGovernorAddress
    );
    timelock = await ethers.getContractAt(
      "TimelockUpgradeable",
      predictedTimelockAddress
    );

    const createDAOParams = {
      daoImplementation: daoImpl.address,
      daoFactory: daoFactory.address,
      accessControlImplementation: accessControlImpl.address,
      salt: ethers.utils.formatBytes32String("randombytes"),
      daoName: "TestDao",
      roles: [
        "EXECUTE_ROLE",
        "UPGRADE_ROLE",
        "WITHDRAWER_ROLE",
        "GOVERNOR_ROLE",
      ],
      rolesAdmins: ["DAO_ROLE", "DAO_ROLE", "DAO_ROLE", "DAO_ROLE"],
      members: [
        [metaFactory.address, executor.address, timelock.address],
        [dao.address, upgrader.address],
        [dao.address, withdrawer.address],
        [govModule.address],
      ],
      daoFunctionDescs: [
        "execute(address[],uint256[],bytes[])",
        "upgradeTo(address)",
      ],
      daoActionRoles: [["EXECUTE_ROLE"], ["UPGRADE_ROLE"]],
    };

    const treasuryData = [
      abiCoder.encode(["address"], [predictedAccessControlAddress]),
      abiCoder.encode(["address"], [treasuryImpl.address]),
      abiCoder.encode(
        ["bytes32"],
        [ethers.utils.formatBytes32String("treasurySalt")]
      ),
    ];

    const treasuryFactoryCalldata =
      treasuryFactory.interface.encodeFunctionData("create", [treasuryData]);

    const tokenFactoryData = [
      abiCoder.encode(["string"], ["DCNT"]),
      abiCoder.encode(["string"], ["DCNT"]),
      abiCoder.encode(["address[]"], [[treasuryModule.address, userA.address]]),
      abiCoder.encode(["uint256[]"], [[1000, 1000]]),
      abiCoder.encode(
        ["bytes32"],
        [ethers.utils.formatBytes32String("tokenSalt")]
      ),
    ];

    const tokenFactoryCalldata = tokenFactory.interface.encodeFunctionData(
      "create",
      [tokenFactoryData]
    );

    const governorFactoryData = [
      abiCoder.encode(["address"], [dao.address]),
      abiCoder.encode(["address"], [accessControl.address]),
      abiCoder.encode(["address"], [token.address]),
      abiCoder.encode(["address"], [govImpl.address]),
      abiCoder.encode(["address"], [timelockImpl.address]),
      abiCoder.encode(["uint64"], [BigNumber.from("0")]),
      abiCoder.encode(["uint256"], [BigNumber.from("1")]),
      abiCoder.encode(["uint256"], [BigNumber.from("5")]),
      abiCoder.encode(["uint256"], [BigNumber.from("0")]),
      abiCoder.encode(["uint256"], [BigNumber.from("4")]),
      abiCoder.encode(["uint256"], [BigNumber.from("1")]),
      abiCoder.encode(
        ["bytes32"],
        [ethers.utils.formatBytes32String("governorSalt")]
      ),
    ];

    const governorFactoryCalldata = govFactory.interface.encodeFunctionData(
      "create",
      [governorFactoryData]
    );

    const innerAddActionsRolesCalldata =
      accessControl.interface.encodeFunctionData("addActionsRoles", [
        [
          predictedTreasuryAddress,
          predictedTreasuryAddress,
          predictedTreasuryAddress,
          predictedTreasuryAddress,
          predictedTreasuryAddress,
          predictedTreasuryAddress,
          predictedGovernorAddress,
          predictedTimelockAddress,
          predictedTimelockAddress,
          predictedTimelockAddress,
          predictedTimelockAddress,
          predictedTimelockAddress,
        ],
        [
          "withdrawEth(address[],uint256[])",
          "withdrawERC20Tokens(address[],address[],uint256[])",
          "withdrawERC721Tokens(address[],address[],uint256[])",
          "depositERC20Tokens(address[],address[],uint256[])",
          "depositERC721Tokens(address[],address[],uint256[])",
          "upgradeTo(address)",
          "upgradeTo(address)",
          "upgradeTo(address)",
          "updateDelay(uint256)",
          "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)",
          "cancel(bytes32)",
          "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)",
        ],
        [
          ["WITHDRAWER_ROLE"],
          ["WITHDRAWER_ROLE"],
          ["WITHDRAWER_ROLE"],
          ["OPEN_ROLE"],
          ["OPEN_ROLE"],
          ["UPGRADE_ROLE"],
          ["UPGRADE_ROLE"],
          ["UPGRADE_ROLE"],
          ["GOVERNOR_ROLE"],
          ["GOVERNOR_ROLE"],
          ["GOVERNOR_ROLE"],
          ["GOVERNOR_ROLE"],
        ],
      ]);

    const outerAddActionsRolesCalldata = dao.interface.encodeFunctionData(
      "execute",
      [[accessControl.address], [0], [innerAddActionsRolesCalldata]]
    );

    const revokeMetafactoryRoleCalldata =
      accessControl.interface.encodeFunctionData("renounceRole", [
        "EXECUTE_ROLE",
        metaFactory.address,
      ]);

    tx = await metaFactory.createDAOAndExecute(
      daoFactory.address,
      createDAOParams,
      [
        treasuryFactory.address,
        tokenFactory.address,
        govFactory.address,
        dao.address,
        accessControl.address,
      ],
      [0, 0, 0, 0, 0],
      [
        treasuryFactoryCalldata,
        tokenFactoryCalldata,
        governorFactoryCalldata,
        outerAddActionsRolesCalldata,
        revokeMetafactoryRoleCalldata,
      ],
      {
        gasLimit: 30000000,
      }
    );
  });

  it("Emitted events with expected deployed contract addresses", async () => {
    await expect(tx)
      .to.emit(metaFactory, "DAOCreated")
      .withArgs(dao.address, accessControl.address, deployer.address);

    expect(tx)
      .to.emit(daoFactory, "DAOCreated")
      .withArgs(
        dao.address,
        accessControl.address,
        metaFactory.address,
        deployer.address
      );

    await expect(tx)
      .to.emit(treasuryFactory, "TreasuryCreated")
      .withArgs(treasuryModule.address, accessControl.address);

    await expect(tx)
      .to.emit(tokenFactory, "TokenCreated")
      .withArgs(token.address);

    await expect(tx)
      .to.emit(govFactory, "GovernorCreated")
      .withArgs(govModule.address, timelock.address);
  });

  it("Setup the correct roles", async () => {
    expect(await accessControl.hasRole("DAO_ROLE", dao.address)).to.eq(true);

    expect(await accessControl.hasRole("DAO_ROLE", metaFactory.address)).to.eq(
      false
    );

    expect(await accessControl.hasRole("EXECUTE_ROLE", executor.address)).to.eq(
      true
    );

    expect(
      await accessControl.hasRole("EXECUTE_ROLE", metaFactory.address)
    ).to.eq(false);

    expect(await accessControl.hasRole("EXECUTE_ROLE", upgrader.address)).to.eq(
      false
    );

    expect(await accessControl.hasRole("UPGRADE_ROLE", upgrader.address)).to.eq(
      true
    );

    expect(await accessControl.hasRole("UPGRADE_ROLE", executor.address)).to.eq(
      false
    );

    expect(
      await accessControl.hasRole("GOVERNOR_ROLE", govModule.address)
    ).to.eq(true);
  });

  it("Sets up the correct DAO role authorization", async () => {
    expect(
      await accessControl.isRoleAuthorized(
        "EXECUTE_ROLE",
        dao.address,
        "execute(address[],uint256[],bytes[])"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        dao.address,
        "execute(address[],uint256[],bytes[])"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "RANDOM_ROLE",
        dao.address,
        "execute(address[],uint256[],bytes[])"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "EXECUTE_ROLE",
        dao.address,
        "upgradeTo(address)"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        dao.address,
        "upgradeTo(address)"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "RANDOM_ROLE",
        dao.address,
        "upgradeTo(address)"
      )
    ).to.eq(false);
  });

  it("Sets up the correct Treasury role authorization", async () => {
    expect(
      await accessControl.isRoleAuthorized(
        "WITHDRAWER_ROLE",
        treasuryModule.address,
        "withdrawEth(address[],uint256[])"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        treasuryModule.address,
        "withdrawEth(address[],uint256[])"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "OPEN_ROLE",
        treasuryModule.address,
        "depositERC20Tokens(address[],address[],uint256[])"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        treasuryModule.address,
        "depositERC20Tokens(address[],address[],uint256[])"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "WITHDRAWER_ROLE",
        treasuryModule.address,
        "withdrawERC20Tokens(address[],address[],uint256[])"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        treasuryModule.address,
        "withdrawERC20Tokens(address[],address[],uint256[])"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "OPEN_ROLE",
        treasuryModule.address,
        "depositERC721Tokens(address[],address[],uint256[])"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        treasuryModule.address,
        "depositERC721Tokens(address[],address[],uint256[])"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "WITHDRAWER_ROLE",
        treasuryModule.address,
        "withdrawERC721Tokens(address[],address[],uint256[])"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        treasuryModule.address,
        "withdrawERC721Tokens(address[],address[],uint256[])"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        treasuryModule.address,
        "upgradeTo(address)"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "WITHDRAWER_ROLE",
        treasuryModule.address,
        "upgradeTo(address)"
      )
    ).to.eq(false);
  });

  it("Sets up the correct Governor module role authorization", async () => {
    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        govModule.address,
        "upgradeTo(address)"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "WITHDRAWER_ROLE",
        govModule.address,
        "upgradeTo(address)"
      )
    ).to.eq(false);
  });

  it("Sets up the correct timelock role authorization", async () => {
    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        timelock.address,
        "upgradeTo(address)"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "GOVERNOR_ROLE",
        timelock.address,
        "upgradeTo(address)"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "GOVERNOR_ROLE",
        timelock.address,
        "updateDelay(uint256)"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        timelock.address,
        "updateDelay(uint256)"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "GOVERNOR_ROLE",
        timelock.address,
        "updateDelay(uint256)"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        timelock.address,
        "updateDelay(uint256)"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "GOVERNOR_ROLE",
        timelock.address,
        "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        timelock.address,
        "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "GOVERNOR_ROLE",
        timelock.address,
        "cancel(bytes32)"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        timelock.address,
        "cancel(bytes32)"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "GOVERNOR_ROLE",
        timelock.address,
        "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        timelock.address,
        "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)"
      )
    ).to.eq(false);
  });

  it("Sets up the correct DAO action authorization", async () => {
    expect(
      await accessControl.actionIsAuthorized(
        executor.address,
        dao.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.solidityPack(
                ["string"],
                ["execute(address[],uint256[],bytes[])"]
              ),
            ]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        timelock.address,
        dao.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.solidityPack(
                ["string"],
                ["execute(address[],uint256[],bytes[])"]
              ),
            ]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        upgrader.address,
        dao.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        executor.address,
        dao.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
          ),
          0,
          4
        )
      )
    ).to.eq(false);
  });

  it("Sets up the correct Treasury action authorization", async () => {
    expect(
      await accessControl.actionIsAuthorized(
        withdrawer.address,
        treasuryModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.solidityPack(
                ["string"],
                ["withdrawEth(address[],uint256[])"]
              ),
            ]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        dao.address,
        treasuryModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.solidityPack(
                ["string"],
                ["withdrawEth(address[],uint256[])"]
              ),
            ]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        withdrawer.address,
        treasuryModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.solidityPack(
                ["string"],
                ["depositERC20Tokens(address[],address[],uint256[])"]
              ),
            ]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        dao.address,
        treasuryModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.solidityPack(
                ["string"],
                ["depositERC20Tokens(address[],address[],uint256[])"]
              ),
            ]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        withdrawer.address,
        treasuryModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.solidityPack(
                ["string"],
                ["withdrawERC20Tokens(address[],address[],uint256[])"]
              ),
            ]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        dao.address,
        treasuryModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.solidityPack(
                ["string"],
                ["withdrawERC20Tokens(address[],address[],uint256[])"]
              ),
            ]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        withdrawer.address,
        treasuryModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.solidityPack(
                ["string"],
                ["depositERC721Tokens(address[],address[],uint256[])"]
              ),
            ]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        dao.address,
        treasuryModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.solidityPack(
                ["string"],
                ["depositERC721Tokens(address[],address[],uint256[])"]
              ),
            ]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        withdrawer.address,
        treasuryModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.solidityPack(
                ["string"],
                ["withdrawERC721Tokens(address[],address[],uint256[])"]
              ),
            ]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        dao.address,
        treasuryModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [
              ethers.utils.solidityPack(
                ["string"],
                ["withdrawERC721Tokens(address[],address[],uint256[])"]
              ),
            ]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        upgrader.address,
        treasuryModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        dao.address,
        treasuryModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
          ),
          0,
          4
        )
      )
    ).to.eq(true);
  });

  it("Sets up the correct Governor module action authorization", async () => {
    expect(
      await accessControl.actionIsAuthorized(
        upgrader.address,
        govModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        dao.address,
        govModule.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
          ),
          0,
          4
        )
      )
    ).to.eq(true);
  });

  it("Sets up the correct timelock action authorization", async () => {
    expect(
      await accessControl.actionIsAuthorized(
        upgrader.address,
        timelock.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
          ),
          0,
          4
        )
      )
    ).to.eq(true);

    expect(
      await accessControl.actionIsAuthorized(
        dao.address,
        timelock.address,
        ethers.utils.hexDataSlice(
          ethers.utils.solidityKeccak256(
            ["bytes"],
            [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
          ),
          0,
          4
        )
      )
    ).to.eq(true);
  });

  it("Supports the expected ERC165 interface", async () => {
    // Supports Module Factory interface
    expect(
      await metaFactory.supportsInterface(
        // eslint-disable-next-line camelcase
        getInterfaceSelector(IMetaFactory__factory.createInterface())
      )
    ).to.eq(true);
  });

  it("Allocated correct token amounts", async () => {
    expect(await token.balanceOf(treasuryModule.address)).to.eq(1000);
  });

  it("Supports creating, voting on, and executing a proposal", async () => {
    await delegateTokens(token, [userA]);

    const transferCallData = treasuryModule.interface.encodeFunctionData(
      "withdrawERC20Tokens",
      [[token.address], [userA.address], [100]]
    );

    const proposalCreatedEvent = await govModPropose(
      [treasuryModule.address],
      [BigNumber.from("0")],
      govModule,
      userA,
      [transferCallData],
      "Proposal #1: transfer 100 tokens from treasury to User A"
    );

    await network.provider.send("evm_mine");

    // Users A votes "For"
    await govModule
      .connect(userA)
      .castVote(proposalCreatedEvent.proposalId, VoteType.For);

    await network.provider.send("evm_mine");
    await network.provider.send("evm_mine");
    await network.provider.send("evm_mine");
    await network.provider.send("evm_mine");
    await network.provider.send("evm_mine");

    await govModule
      .connect(userA)
      .queue(
        proposalCreatedEvent.targets,
        proposalCreatedEvent._values,
        proposalCreatedEvent.calldatas,
        ethers.utils.id(proposalCreatedEvent.description)
      );

    await govModule
      .connect(userA)
      .execute(
        proposalCreatedEvent.targets,
        proposalCreatedEvent._values,
        proposalCreatedEvent.calldatas,
        ethers.utils.id(proposalCreatedEvent.description)
      );

    expect(await token.balanceOf(treasuryModule.address)).to.eq(900);

    expect(await token.balanceOf(userA.address)).to.eq(1100);
  });
});
