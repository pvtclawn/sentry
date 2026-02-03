/**
 * Revoke duplicate attestations - keep only newest per agent
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const EAS_ADDRESS = "0x4200000000000000000000000000000000000021";
const SCHEMA_UID = "0x8a333ad4136176b36dd826d3f8fa5ef796b1edc923f878676cabbac8d7c84f8d";
const VAULT_PATH = join(import.meta.dir, "../../../.vault");
const FOUNDRY_PATH = join(process.env.HOME!, ".foundry/bin");

// UIDs to revoke (duplicates - older attestations)
const TO_REVOKE = [
  "0xd554162fc8b3ed0b44150778085e4b1465e54a684ac9192192388fe6e1251573",
  "0x566d4cb6c5af24ec51779a57a7ac066bcf06d84f5599aef79cfc870641e4a4ed",
  "0xeba2a012162c09dee7862c0ba8db2850faa60156ce8470d709c35d3f68e1eab0",
  "0xb4642c9f33568cbcede56b62ed45d2da2d10d4cd4d6c5c1d6d2ab3214a523b34",
  "0x80ea68156712f0418e3c7e6762c3114b74c98c6d74134ea9b2633c1e4c231a5a",
  "0x11951e98939e2da1faba053a2ac7e3d6f7bff66495ca22676c43583897e00c16",
  "0xca177df895f7fc96add50e872ee5df8c9f60765cb3c64b0d0145ef547dfcec61",
  "0xf5d790d78cdb8c8660ad2b5bc5faae4225413893390d0a32381e2cd35a6600f8",
  "0x5216930524beac6afcac1dcc37ca756696114ca57ac0be769938b63a95563251",
  "0x419d6734c2ddb417c5b91583ba0a5bf9e51c5d4f487b7bb17b6c1c74eb3bb017",
  "0x5efeb5e94035431aa426fd1abca0434351b2c2ca0af7590dba54172e237e2d68",
  "0x8356af70614732845a860869df452d27d3a0cd9ccba81197479c52b646a4f3dc",
  "0xb211dac8da708452c38fa42fb602cad89d2251b64b036672d1b38ed3520e9204",
  "0x7b575dacfaab9d204d4d77df367fc85a1ce6a66df28f6abbc694c1c139df97ba",
  "0xfc20f13dde0562f94c6d3d2a05263a2d8e8885f7097c5a69588ad8d120910b57",
  "0xa0499a7f70b5f2e98101fa7990f1b8ba0c470b446a682a848210dbd7390ae425",
  "0x7e214a3a94544e11ecabcb290432e9c1cfb1c0fc84eed086d8dedd48a36a9d0b",
  "0xde2af995c6418b98af47daf66ef3c8549abd6b24ac91eebb84dcc9ea2bc457a3",
  "0xf98bb0615a7ef92fad2e427621e3cfb15618dc2d139b2f8441c9d2a57adc00f1",
  "0x89107aff7cb5418de02c7927f480514bf7b285c32a83ce237e09d449ecafdbaa",
  "0x8356c650f0b204bb179cbabfd02d1e50bebd6b1c8de7093c2a9ef9f9a58baa8e",
  "0xd7f6ffa3f1b13aaad3a4f3f61b971af456aab6193139e00b03fb6aa940481336",
  "0x5ec1b342bd473899bb197b89d2ec9cd5773209c2ccb88c5a22aa41fdfc48f616",
  "0xf57a159692501f60de7858f95dfe089617b3ebcb5d053d2e36dfd8c576801b39",
  "0x2e8c00fd5527b2067c6768547127f265c5e58feabac89f908709da080d94ce51",
  "0x568b385b6769f9a3aa12a2c73fffe60e00a54c3ab3a096a6cb43fcec17a57db5",
  "0x56599d59965be0aadcac1b9e94c384c9b1bd549d40eea7ed6af64d05fb484039",
  "0xfd2777d28d3de8de4027cd876a833221c4054fb2242792007c512a2063ef5541",
  "0x3b80089c31ef46293fd00b7990a9813463db94840b7e51c07c6f32d9fc323499",
  "0x420a94b16baa556e056b46c546582e61bc245b7bf89c6fc181cc2de972b3c38b",
  "0x3b71bafc4d90b8c91d3b97756dcac4bb3aab71772b601438cc8a2f345ba2e695",
  "0x13865fc9c5fa47e2c50cfdddfd68e3bc0c3ffda54cb7f6671ec2abb04d737d83",
  "0x70a4c54985b30d5c385783f8c5132b0fca3b375dde268f779f57aa48672e7668",
  "0xe4b7bf04ff7bb32bd856c39ec2d6c8fd7acf5ed0f99c1a4846f24969a601dee5",
  "0xb39ef5986f6768aac162af75c610417e3d9887ff289bf07b714d36af99d33d32",
  "0xec5847fec37e8a914582d061072f71fdcaceeae61f7f7278ef1441354c64ee34",
  "0xe31e9f8fd0f4a6b86dc179ed656c693884bad8c16fb2389612329d30690ca121",
  "0xebad1ed7d9849e2f2e751cf22b421a2e3db10c542ac0e6117e431073abc26083",
  "0x9f7ca74db401720c9388101fdc29e300a966a8585f37af3954933eab513a0eda",
  "0x9f87ca6a21c8e9e76de1c6f24625d4396a923e882c88a535e168a055543ed179",
  "0xbbf8fd632f2d5edfa9013125f45788e53efa1c6b8b9492533470dc99de84455e",
  "0x363474bacbdd065a44a6b9c00ee1146f1f6d4f9d5b86233d688d78600b145f75",
  "0xebda3352e605d1af8a422156f8a4ca1414ce3904a27b79de00d2eb0d4d8bb631",
  "0x9552dbcce217493b971df292f69ce1b05f09367b70e2d192038ec2925a1ddac5",
  "0x4abe055d8a10812c7035f8dfec346a83f6b793c970278a7e7b3a51dc07fd6e9a",
  "0x2b6e2b532ac5e443cba0c561b348a929ad31fe168ea08a1c55d6f57312373e9d",
  "0x77d7bffc28030a31b5f62cac25260567ac512123a7842971c842d835554d89af",
  "0xa7318b5adee16b78c0b009932e27256be5a962647cf3aa5b162e7e7f97793b6d",
  "0xd2859074fb05d088c9f9d90a93a4f682eca743dfcb8810a45d7e04573a1a8e33",
  "0xeecca3c9a90f8035a9b820bc9f5231f66cffb7b7e0ca88302941b89d698c28c1",
  "0xd22f25b671f3d5e633b983a94c2299877398c1fcaf78f5533b8faecc46cf9e28",
  "0xc1d17940e012d2962825046b715e7e5b6cbd7846d57e215448c4fe8bafa91976",
  "0x8a78e604676013ef45773a4020f4087ded4e89ff0c45dd041569195a8d66102a",
  "0x6c53ac29d0e2deeb8dfb8a39fee349d7337721d8e8024f8eaecdbc82b8c9b301",
  "0x3111c1f169744813d41247361b849bf90dea0472aa926ce9e13f363385f8e92a",
  "0x939e73d706104694770f312c4409c21dac59ed25983b7d6f08ce8fb8894382c9",
  "0xa2207b8668d29152f7146a42c3a155bba161918200c7fdb86317d31c61a1baab",
  "0x18f57baa4d2b212f47e8958c0ee08386c4d5f0f46e235a7d3cc381bf22c8ba3a",
  "0x331bfb2840890c5246b0a7e9216e1561c0af5f0f9e7273656cddd1bef5e92585",
  "0x5eaabfe24437f458a9ed44962479875bccfbe59bb13f51ac396ca1db75ad64f7",
  "0x8a80922018d89f9efcd62a6029b903b0855975561d7306a1774be8b730b98e8c",
  "0xec7bf0aef16fbf3118a8edbfa03b09c6c4fc2133c020b7d86c71621e35a3a66d",
  "0x0e229470abb49d19cc564a821ebd8de9bb6b3c7dda4dbad1c225abc3cd4fcbd7",
  "0x4c8ec6afd0b3940858a56239337d6e52ec957a82bc53090a316dd719d217a628",
  "0xdaf55a64341f0bd3e04db0ad6a5ce093f4fc59972402a0a6e5d0845384024820",
  "0xca1be8d15eb2085d939b1b4dc6f22855e046f71a49b9ec9809f2cf0ca0e31669",
  "0x7a5d856ff89170abb4aebc5d417c0cd1553a1e51070dc1b1ced7b53d34f91c8a",
  "0xe53189e5c86e8e3589c14c975ed91dbc097237b44bfde26a6b52bd553961e4a3",
  "0x8f9cc6069c594583c79f87702e61e7227d0c703237511be1e831ddf793ebb331",
  "0xe0bd11cd74fac905d616ee621cd54078fa0e134ef64644ed0cb686c199eead97",
  "0xce45a3910940a3690223b5a449e7d93c485229ae49ad6cf17fbeed76dda2feaf",
  "0x88d1b574d86d17845628c083ea9d94ae9ee5ff889d1afc685f2541ad71ebe3cc",
  "0x45e0eaab21e89998610534f750541b12b455b25a13325aba1d1746e3839359ad",
  "0x186080f60ae6758855da3a69862578117595aa045c8aac108fbbdb0c32b0c375",
  "0xfc192a1e8a35c7518108dbe2de780e736a55653d0153324b1ecd62cde21cb703",
  "0x96b8359ae019fe92761fec6a8a69cf42a9044d2edb20e9c077ef439664d24572",
];

function getWalletPassword(): string {
  const secretsPath = join(VAULT_PATH, "secrets.json");
  const secrets = JSON.parse(readFileSync(secretsPath, "utf8"));
  return secrets.WALLET_PASSWORD;
}

async function main() {
  console.log("🗑️ Revoking duplicate attestations...");
  console.log(`Total to revoke: ${TO_REVOKE.length}\n`);

  const password = getWalletPassword();
  const pwFile = "/tmp/castpw";
  writeFileSync(pwFile, password);

  let revoked = 0;
  let failed = 0;

  try {
    for (const uid of TO_REVOKE) {
      try {
        // EAS revoke function: revoke((bytes32 schema, (bytes32 uid, uint256 value) data))
        const revokeStruct = `(${SCHEMA_UID},(${uid},0))`;
        
        const cmd = `${FOUNDRY_PATH}/cast send ${EAS_ADDRESS} "revoke((bytes32,(bytes32,uint256)))" "${revokeStruct}" --rpc-url https://mainnet.base.org --account clawn --password-file ${pwFile}`;
        
        const result = execSync(cmd, { encoding: "utf8", timeout: 60000 });
        
        const txMatch = result.match(/transactionHash\s+(\S+)/);
        const txHash = txMatch?.[1] ?? "?";
        
        console.log(`✓ Revoked ${uid.slice(0, 16)}... TX: ${txHash.slice(0, 16)}...`);
        revoked++;
        
        // Wait between revocations
        await new Promise((r) => setTimeout(r, 1500));
      } catch (e) {
        const msg = (e as Error).message;
        console.log(`✗ Failed ${uid.slice(0, 16)}...: ${msg.slice(0, 60)}`);
        failed++;
      }
    }
  } finally {
    if (existsSync(pwFile)) {
      execSync(`rm ${pwFile}`);
    }
  }

  console.log(`\n✅ Done! Revoked: ${revoked}, Failed: ${failed}`);
}

main().catch(console.error);
