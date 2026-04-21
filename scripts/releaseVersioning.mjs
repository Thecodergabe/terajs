const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

const RELEASE_PRIORITY = {
  patch: 0,
  minor: 1,
  major: 2
};

export function parseVersion(version) {
  if (typeof version !== "string") {
    throw new Error(`Expected a version string, received ${typeof version}.`);
  }

  const match = VERSION_PATTERN.exec(version.trim());
  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10)
  };
}

export function compareVersions(leftVersion, rightVersion) {
  const left = parseVersion(leftVersion);
  const right = parseVersion(rightVersion);

  if (left.major !== right.major) {
    return left.major > right.major ? 1 : -1;
  }

  if (left.minor !== right.minor) {
    return left.minor > right.minor ? 1 : -1;
  }

  if (left.patch !== right.patch) {
    return left.patch > right.patch ? 1 : -1;
  }

  return 0;
}

export function bumpVersion(version, releaseType) {
  const parsed = parseVersion(version);

  if (releaseType === "major") {
    return `${parsed.major + 1}.0.0`;
  }

  if (releaseType === "minor") {
    return `${parsed.major}.${parsed.minor + 1}.0`;
  }

  if (releaseType === "patch") {
    return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }

  throw new Error(`Unsupported release type: ${releaseType}`);
}

export function detectReleaseType(previousVersion, nextVersion) {
  const previous = parseVersion(previousVersion);
  const next = parseVersion(nextVersion);

  if (compareVersions(previousVersion, nextVersion) > 0) {
    throw new Error(`Version cannot move backwards: ${previousVersion} -> ${nextVersion}`);
  }

  if (previous.major !== next.major) {
    return "major";
  }

  if (previous.minor !== next.minor) {
    return "minor";
  }

  if (previous.patch !== next.patch) {
    return "patch";
  }

  return null;
}

export function pickHighestVersion(versions) {
  return versions.reduce((highest, candidate) => {
    if (highest === null || compareVersions(candidate, highest) > 0) {
      return candidate;
    }

    return highest;
  }, null);
}

export function pickHighestReleaseType(releaseTypes) {
  return releaseTypes.reduce((highest, candidate) => {
    if (!candidate) {
      return highest;
    }

    if (!highest || RELEASE_PRIORITY[candidate] > RELEASE_PRIORITY[highest]) {
      return candidate;
    }

    return highest;
  }, null);
}

export function computeNextRepoVersion({ previousRepoVersion, currentPublicVersions, versionChanges }) {
  if (!Array.isArray(versionChanges) || versionChanges.length === 0) {
    return null;
  }

  const highestReleaseType = pickHighestReleaseType(
    versionChanges.map((change) => detectReleaseType(change.previousVersion, change.nextVersion))
  );

  if (!highestReleaseType) {
    return null;
  }

  const releaseBumpedVersion = bumpVersion(previousRepoVersion, highestReleaseType);
  const highestPublicVersion = pickHighestVersion(currentPublicVersions);

  if (!highestPublicVersion) {
    return releaseBumpedVersion;
  }

  return compareVersions(releaseBumpedVersion, highestPublicVersion) >= 0
    ? releaseBumpedVersion
    : highestPublicVersion;
}