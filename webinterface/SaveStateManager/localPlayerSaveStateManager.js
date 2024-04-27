///////////////////////////////////////////////////
// IMPOTRS
///////////////////////////////////////////////////
const fileManager = require("../fileManager");
///////////////////////////////////////////////////
// VARIABLES
///////////////////////////////////////////////////

// read save state
const saveData = fileManager;
let recordData = saveState.properties.recordData;

let playerUID = saveData.PlayerUId.value;
let instanceID = saveData.IndividualId.value.InstanceId.value;
let lastTransform = {
  Rotation: saveData.LastTransform.value.Rotation.value,
  Location: saveData.LastTransform.value.Location.value,
};
let playerCharacterMakeData = {
  BodyMeshName: saveData.PlayerCharacterMakeData.value.BodyMeshName.value,
  HeadMeshName: saveData.PlayerCharacterMakeData.value.HeadMeshName.value,
  HairMeshName: saveData.PlayerCharacterMakeData.value.HairMeshName.value,
  ArmVolume: saveData.PlayerCharacterMakeData.value.ArmVolume.value,
  TorsoVolume: saveData.PlayerCharacterMakeData.value.TorsoVolume.value,
  LegVolume: saveData.PlayerCharacterMakeData.value.LegVolume.value,

  HairColor: saveData.PlayerCharacterMakeData.value.HairColor.value,
  BrowColor: saveData.PlayerCharacterMakeData.value.BrowColor.value,
  BodyColor: saveData.PlayerCharacterMakeData.value.BodyColor.value,
  BodySubsurfaceColor:
    saveData.PlayerCharacterMakeData.value.BodySubsurfaceColor.value,
  EyeColor: saveData.PlayerCharacterMakeData.value.EyeColor.value,
  EyeMaterialName: saveData.PlayerCharacterMakeData.value.EyeMaterialName.value,
  VoiceID: saveData.PlayerCharacterMakeData.value.VoiceID.value,
};
let bossTechnologyPoint = saveData.BossTechnologyPoint.value;
let unlockedRecipeTechnologyNames =
  saveData.UnlockedRecipeTechnologyNames.value.values;

let towerBossDefeatFlag = recordData.value.TowerBossDefeatFlag.value;
let normalBossDefeatFlag = recordData.value.NormalBossDefeatFlag.value;
let tribeCaptureCount = recordData.TribeCaptureCount.value;
let palCaptureCount = recordData.PalCaptureCount.value;
let paldeckUnlockFlag = recordData.PaldeckUnlockFlag.value;

let palCaptureCountBonusCounts = {
  Tier1: recordData.PalCaptureCountBonusCount_Tier1.value,
  Tier2: recordData.PalCaptureCountBonusCount_Tier2.value,
  Tier3: recordData.PalCaptureCountBonusCount_Tier3.value,
};
let relicObtainForInstanceFlag = recordData.RelicObtainForInstanceFlag.value;
let relicPossessNum = recordData.RelicPossessNum.value;
let noteObtainForInstanceFlag = recordData.NoteObtainForInstanceFlag.value;
let fastTravelPointUnlockFlag = recordData.FastTravelPointUnlockFlag.value;
